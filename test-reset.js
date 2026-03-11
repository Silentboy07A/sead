const http = require('http');
const { MongoClient } = require('mongodb');
require('dotenv').config();

(async () => {
    try {
        console.log('Sending forgot password request...');
        const req = http.request('http://localhost:3000/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                const fData = JSON.parse(data);
                console.log('Forgot password response:', fData);

                const c = new MongoClient(process.env.MONGODB_URI);
                await c.connect();
                const u = await c.db('cintic').collection('users').findOne({ email: 'admin@cintic.com' });
                console.log('User reset token hash in DB:', u.resetToken ? 'EXISTS' : 'MISSING');
                console.log('Token expires:', u.resetExpires);
                await c.close();
            });
        });
        req.write(JSON.stringify({ email: 'admin@cintic.com' }));
        req.end();
    } catch (e) {
        console.error(e);
    }
})();
