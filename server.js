require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Mandatory Secrets Check
const REQUIRED_SECRETS = ['MONGODB_URI', 'JWT_SECRET', 'GROQ_API_KEY', 'GOOGLE_CLIENT_ID'];
const missing = REQUIRED_SECRETS.filter(s => !process.env[s]);
if (missing.length > 0) {
    console.error('FATAL: Missing environment variables:', missing.join(', '));
    process.exit(1);
}

const IS_PROD = process.env.NODE_ENV === 'production';

// ---- Global Error Handlers (CodeRabbit Best Practice) ----
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
    // In a real prod env, we might want to gracefully shutdown or notify an error service
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const BODY_LIMIT = 1 * 1024 * 1024; // 1MB

const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// ---- Security: Unified Policy (CodeRabbit) ----
function getSecurityHeaders(csrfCookie) {
    const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.youtube.com https://s.ytimg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https://image.tmdb.org https://lh3.googleusercontent.com",
            "frame-src https://www.youtube.com https://accounts.google.com",
            "connect-src 'self' https://api.groq.com"
        ].join('; ')
    };
    if (csrfCookie) {
        headers['Set-Cookie'] = csrfCookie;
    }
    return headers;
}

// ---- Distributed Rate Limiter (MongoDB-backed) ----
const { connectToDatabase } = require('./api/utils/db');
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

async function isRateLimited(ip, path) {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection('rate_limits_global');
        const now = Date.now();
        const isAuth = path.startsWith('/api/auth/');
        const maxRequests = isAuth ? 5 : 60; // Slightly more generous for global browsing
        
        const key = `${ip}:${isAuth ? 'auth' : 'global'}`;
        
        // Find or create the limit entry
        const limit = await collection.findOne({ _id: key });
        
        if (!limit || now > limit.reset) {
            // Upsert new window
            await collection.updateOne(
                { _id: key },
                { $set: { count: 1, reset: now + RATE_LIMIT_WINDOW } },
                { upsert: true }
            );
            return false;
        } else {
            // Increment count
            const updated = await collection.findOneAndUpdate(
                { _id: key },
                { $inc: { count: 1 } },
                { returnDocument: 'after' }
            );
            return updated.count > maxRequests;
        }
    } catch (e) {
        console.error('Rate limit error:', e);
        return false; // Fail open for the core server to avoid locking everyone out on DB hiccups
    }
}

const { parseCookies } = require('./api/utils/jwt');
const crypto = require('crypto');

const server = http.createServer(async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    if (await isRateLimited(ip, url.pathname)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Too many requests. Please slow down.' }));
    }

    // ---- CSRF Protection (CodeRabbit: Double Submit Cookie) ----
    const cookies = parseCookies(req.headers.cookie);
    let csrfCookie = cookies.csrf_token;
    
    // Check CSRF for non-GET/HEAD requests
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const csrfHeader = req.headers['x-csrf-token'];
        if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'CSRF token mismatch or missing' }));
        }
    }

    // Set CSRF cookie if missing or on page load
    const newCsrfToken = csrfCookie || crypto.randomBytes(32).toString('hex');
    const csrfCookieHeader = `csrf_token=${newCsrfToken}; Path=/; SameSite=Strict${IS_PROD ? '; Secure' : ''}`;

    // ---- Poster proxy (bypasses browser CORS on TMDB) ----
    if (url.pathname === '/api/poster' || url.pathname === '/poster') {
        const imgUrl = url.searchParams.get('url');
        if (!imgUrl || !imgUrl.startsWith('https://image.tmdb.org/')) {
            res.writeHead(400);
            return res.end('Invalid URL');
        }
        try {
            const https = require('https');
            const proxyReq = https.get(imgUrl, {
                timeout: 5000, // Handle proxy timeouts (CodeRabbit)
                headers: {
                    'User-Agent': 'CinTic/1.0',
                    'Referer': 'https://www.themoviedb.org/'
                }
            }, (proxyRes) => {
                if (proxyRes.statusCode >= 400) {
                    res.writeHead(proxyRes.statusCode);
                    return res.end();
                }
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
                    'Cache-Control': 'public, max-age=86400'
                });
                proxyRes.pipe(res);
            });
            proxyReq.on('timeout', () => { proxyReq.destroy(); res.writeHead(504); res.end(); });
            proxyReq.on('error', () => { if (!res.headersSent) { res.writeHead(500); res.end(); } });
        } catch (e) {
            if (!res.headersSent) { res.writeHead(500); res.end(); }
        }
        return;
    }

    // ---- API routes ----
    if (url.pathname.startsWith('/api/')) {
        // Strip leading /api/ and resolve handler file
        const route = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '') || 'index';
        const handlerPath = path.join(__dirname, 'api', route + '.js');

        // Build a minimal Express-like req/res wrapper
        let body = '';
        
        let targetHandlerPath = handlerPath;
        
        // Custom local routing for Vercel dynamic routes
        if (!fs.existsSync(targetHandlerPath)) {
            if (route.startsWith('auth/')) {
                const action = route.split('/')[1];
                req.query = { ...(req.query || {}), action };
                targetHandlerPath = path.join(__dirname, 'api', 'auth', '[action].js');
            } else if (route.startsWith('admin/')) {
                const resource = route.split('/')[1];
                req.query = { ...(req.query || {}), resource };
                targetHandlerPath = path.join(__dirname, 'api', 'admin', '[resource].js');
            } else if (route === 'movies' || route === 'theatres' || route === 'config') {
                req.query = { ...(req.query || {}), type: route };
                targetHandlerPath = path.join(__dirname, 'api', 'data.js');
            } else if (route === 'lock-seats' || route === 'check-locked-seats' || route === 'bookings/create') {
                const typeMap = { 'lock-seats': 'lock', 'check-locked-seats': 'check', 'bookings/create': 'create' };
                req.query = { ...(req.query || {}), type: typeMap[route] };
                targetHandlerPath = path.join(__dirname, 'api', 'booking.js');
            }
            
            if (!fs.existsSync(targetHandlerPath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'API route not found', route }));
            }
        }

        req.on('data', chunk => {
            body += chunk;
            if (body.length > BODY_LIMIT) { // DoS Protection (CodeRabbit)
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Payload too large' }));
                req.destroy();
            }
        });

        req.on('end', async () => {
            // Populate req.query from URL
            const queryParams = Object.fromEntries(url.searchParams);
            
            // Custom local routing for Vercel dynamic routes (Fixed parameter overwriting)
            const isDynamicAuth = route.startsWith('auth/') && !fs.existsSync(handlerPath);
            const isDynamicAdmin = route.startsWith('admin/') && !fs.existsSync(handlerPath);
            const isDataRoute = (route === 'movies' || route === 'theatres' || route === 'config');
            const isBookingRoute = (route === 'lock-seats' || route === 'check-locked-seats' || route === 'bookings/create');
            
            if (isDynamicAuth) {
                queryParams.action = route.split('/')[1];
            } else if (isDynamicAdmin) {
                queryParams.resource = route.split('/')[1];
            } else if (isDataRoute) {
                queryParams.type = route;
            } else if (isBookingRoute) {
                const typeMap = { 'lock-seats': 'lock', 'check-locked-seats': 'check', 'bookings/create': 'create' };
                queryParams.type = typeMap[route];
            }
            
            req.query = queryParams;

            try {
                if (body) req.body = JSON.parse(body);
                else req.body = {};
            } catch { req.body = {}; }

            // Minimal res helpers
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
                if (!res.headersSent) {
                    res.setHeader('Content-Type', 'application/json');
                    
                    const origin = req.headers.origin;
                    if (origin && (origin.includes('localhost') || origin.includes('vercel.app'))) {
                        res.setHeader('Access-Control-Allow-Origin', origin);
                    }
                    
                    // Security Headers (CodeRabbit Unified Policy)
                    // Note: If the handler also sets a Set-Cookie (e.g. login), we need to merge
                    const existingCookie = res.getHeader('Set-Cookie');
                    const headers = getSecurityHeaders(csrfCookieHeader);
                    
                    Object.entries(headers).forEach(([k, v]) => {
                        if (k === 'Set-Cookie' && existingCookie) {
                            const cookies = Array.isArray(existingCookie) ? existingCookie : [existingCookie];
                            res.setHeader(k, [...cookies, v]);
                        } else {
                            res.setHeader(k, v);
                        }
                    });
                }
                res.end(JSON.stringify(data));
            };

            try {
                // Production Optimization: Only clear cache in dev mode
                if (!IS_PROD) {
                    const apiDir = path.join(__dirname, 'api');
                    Object.keys(require.cache).forEach(key => {
                        if (key.startsWith(apiDir)) delete require.cache[key];
                    });
                }
                const handler = require(targetHandlerPath);
                await handler(req, res);
            } catch (err) {
                console.error('Handler error:', err);
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    // Secure error messages in production (CodeRabbit)
                    res.end(JSON.stringify({ error: IS_PROD ? 'Internal server error' : err.message }));
                }
            }
        });
        return;
    }

    // ---- Static files ----
    let safePath = url.pathname === '/' ? '/index.html' : url.pathname;
    // Path Traversal Protection (CodeRabbit)
    const normalizedPath = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(__dirname, normalizedPath);

    // Prevent access outside of root directory
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    // SPA fallback
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
    if (err) {
        res.writeHead(404);
        return res.end('Not found');
    }
    const headers = { 
        'Content-Type': mime,
        ...getSecurityHeaders(csrfCookieHeader)
    };
    res.writeHead(200, headers);
    res.end(data);
});
});

server.listen(PORT, () => {
    console.log(`\n🎬 Cintic dev server running at http://localhost:${PORT}`);
    console.log(`   Seed the DB at: http://localhost:${PORT}/api/seed`);
    console.log(`   Press Ctrl+C to stop\n`);
});
