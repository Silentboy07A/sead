const { connectToDatabase } = require('./_lib/utils/db');

// Serverless proxy for TMDB images (Vercel)
// Usage: /api/poster?url=https://image.tmdb.org/t/p/w500/xxx.jpg
module.exports = async (req, res) => {
    const imgUrl = req.query && req.query.url;

    if (!imgUrl || !imgUrl.startsWith('https://image.tmdb.org/')) {
        res.status(400).end('Invalid URL');
        return;
    }

    return new Promise((resolve) => {
        const proxyReq = https.get(imgUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CinTic/1.0)',
                'Referer': 'https://www.themoviedb.org/'
            }
        }, (proxyRes) => {
            res.statusCode = proxyRes.statusCode;
            res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Access-Control-Allow-Origin', '*');
            proxyRes.pipe(res);
            proxyRes.on('end', resolve);
        });
        proxyReq.on('error', () => { res.status(500).end(); resolve(); });
    });
};
