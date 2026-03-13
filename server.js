require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

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

const server = http.createServer(async (req, res) => {
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
                headers: {
                    'User-Agent': 'CinTic/1.0',
                    'Referer': 'https://www.themoviedb.org/'
                }
            }, (proxyRes) => {
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
                    'Cache-Control': 'public, max-age=86400'
                });
                proxyRes.pipe(res);
            });
            proxyReq.on('error', () => { res.writeHead(500); res.end(); });
        } catch (e) {
            res.writeHead(500);
            res.end();
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

        req.on('data', chunk => (body += chunk));
        req.on('end', async () => {
            // Populate req.query from URL
            req.query = Object.fromEntries(url.searchParams);

            try {
                if (body) req.body = JSON.parse(body);
                else req.body = {};
            } catch { req.body = {}; }

            // Minimal res helpers
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
                if (!res.headersSent) {
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('X-Content-Type-Options', 'nosniff');
                    res.setHeader('X-Frame-Options', 'DENY');
                    res.setHeader('X-XSS-Protection', '1; mode=block');
                }
                res.end(JSON.stringify(data));
            };

            try {
                // Production Optimization: Only clear cache in dev mode
                if (process.env.NODE_ENV !== 'production') {
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
                    res.end(JSON.stringify({ error: err.message }));
                }
            }
        });
        return;
    }

    // ---- Static files ----
    let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);

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
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n🎬 Cintic dev server running at http://localhost:${PORT}`);
    console.log(`   Seed the DB at: http://localhost:${PORT}/api/seed`);
    console.log(`   Press Ctrl+C to stop\n`);
});
