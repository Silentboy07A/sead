const { connectToDatabase } = require('../utils/db');
const sanitize = require('../utils/sanitize');

module.exports = async (req, res) => {
    // Restrict CORS (Security alignment)
    const origin = req.headers.origin;
    if (origin && (origin.includes('localhost') || origin.includes('vercel.app'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', true);
    }

    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const sanitizedBody = sanitize(req.body);
        const theatreId = Number(sanitizedBody.theatreId);
        const { showIndex, date } = sanitizedBody;

        if (!theatreId || showIndex === undefined || !date) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const { db } = await connectToDatabase();
        const locks = db.collection('locked_seats');
        const bookings = db.collection('bookings');

        // 1. Fetch active locks
        const activeLocks = await locks.find({
            theatreId,
            showIndex,
            date,
            expiresAt: { $gt: new Date() }
        }).toArray();

        // 2. Fetch permanent bookings
        const permanentBookings = await bookings.find({
            theatreId,
            showIndex,
            date
        }).toArray();

        const lockedSeats = activeLocks.map(l => l.seatId);
        const bookedSeats = [];
        permanentBookings.forEach(b => {
            if (Array.isArray(b.seats)) {
                bookedSeats.push(...b.seats);
            }
        });

        res.status(200).json({ 
            lockedSeats, 
            bookedSeats 
        });
    } catch (error) {
        console.error('Check locked seats error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
