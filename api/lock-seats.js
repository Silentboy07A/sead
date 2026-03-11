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
        const { theatreId, showIndex, date, seats } = req.body;

        if (!theatreId || showIndex === undefined || !date || !seats || !seats.length) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const { db } = await connectToDatabase();
        const locks = db.collection('locked_seats');

        // Check if any of these seats are already locked
        const query = {
            theatreId,
            showIndex,
            date,
            seatId: { $in: seats },
            expiresAt: { $gt: new Date() } // Only active locks
        };

        const existingLocks = await locks.find(query).toArray();
        if (existingLocks.length > 0) {
            return res.status(409).json({
                message: 'Some seats are already locked by another user',
                lockedSeats: existingLocks.map(l => l.seatId)
            });
        }

        // Create locks for 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const lockDocs = seats.map(seatId => ({
            theatreId,
            showIndex,
            date,
            seatId,
            createdAt: new Date(),
            expiresAt
        }));

        await locks.insertMany(lockDocs);

        res.status(200).json({ message: 'Seats locked successfully', expiresAt });
    } catch (error) {
        console.error('Lock seats error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
