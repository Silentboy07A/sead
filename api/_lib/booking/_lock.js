const { connectToDatabase } = require('../utils/db');
const sanitize = require('../utils/sanitize');

module.exports = async (req, res) => {
  // Restrict CORS (Security alignment)
  const { origin } = req.headers;
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
    const { showIndex, date, seats } = sanitizedBody;

    if (!theatreId || showIndex === undefined || !date || !Array.isArray(seats) || !seats.length) {
      return res.status(400).json({ message: 'Valid theatreId, showIndex, date, and seats array are required' });
    }

    const { db } = await connectToDatabase();
    const locks = db.collection('locked_seats');

    // Create locks for 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const lockDocs = seats.map((seatId) => ({
      theatreId,
      showIndex,
      date,
      seatId,
      createdAt: new Date(),
      expiresAt,
    }));

    try {
      // Atomic insertion: relies on the Unique Index "unique_seat_lock" created in init-db.js
      await locks.insertMany(lockDocs, { ordered: true });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        // Duplicate key error = someone else just locked one of these seats
        return res.status(409).json({
          message: 'Concurrency Conflict: One or more selected seats were just locked by another user.',
          error: 'DUPLICATE_LOCK',
        });
      }
      throw dbErr;
    }

    res.status(200).json({ message: 'Seats locked successfully', expiresAt });
  } catch (error) {
    console.error('Lock seats error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
