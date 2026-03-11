const { connectToDatabase } = require('./utils/db');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { theatreId, showIndex, date } = req.body;

        if (!theatreId || showIndex === undefined || !date) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const { db } = await connectToDatabase();
        const locks = db.collection('locked_seats');

        // Allow MongoDB to automatically clean up expired locks by creating a TTL index in the background
        await locks.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 }).catch(() => { });

        // Fetch active locks
        const activeLocks = await locks.find({
            theatreId,
            showIndex,
            date,
            expiresAt: { $gt: new Date() }
        }).toArray();

        const lockedSeats = activeLocks.map(l => l.seatId);

        res.status(200).json({ lockedSeats });
    } catch (error) {
        console.error('Check locked seats error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
