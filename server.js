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

// ---- Rate Limiter (In-memory) ----
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 50; // Max requests per window
const rateLimits = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const limit = rateLimits.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW };
    
    if (now > limit.reset) {
        limit.count = 1;
        limit.reset = now + RATE_LIMIT_WINDOW;
    } else {
        limit.count++;
    }
    rateLimits.set(ip, limit);
    return limit.count > RATE_LIMIT_MAX;
}

const server = http.createServer(async (req, res) => {
    const ip = req.socket.remoteAddress;
    if (isRateLimited(ip)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Too many requests' }));
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

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
            if (!fs.existsSync(targetHandlerPath)) {
                if (route.startsWith('auth/')) {
                    queryParams.action = route.split('/')[1];
                    targetHandlerPath = path.join(__dirname, 'api', 'auth', '[action].js');
                } else if (route.startsWith('admin/')) {
                    queryParams.resource = route.split('/')[1];
                    targetHandlerPath = path.join(__dirname, 'api', 'admin', '[resource].js');
                }
                
                if (!fs.existsSync(targetHandlerPath)) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'API route not found', route }));
                }
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
                    
                    res.setHeader('X-Content-Type-Options', 'nosniff');
                    res.setHeader('X-Frame-Options', 'DENY');
                    res.setHeader('X-XSS-Protection', '1; mode=block');
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
        res.writeHead(200, { 
            'Content-Type': mime,
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
        });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n🎬 Cintic dev server running at http://localhost:${PORT}`);
    console.log(`   Seed the DB at: http://localhost:${PORT}/api/seed`);
    console.log(`   Press Ctrl+C to stop\n`);
});
