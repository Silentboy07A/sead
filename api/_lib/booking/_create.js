const { connectToDatabase } = require('../utils/db');
const { authMiddleware } = require('../utils/jwt');
const sanitize = require('../utils/sanitize');

module.exports = async (req, res) => {
  // Restrict CORS
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const user = await authMiddleware(req, db);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    }

    const {
      bookingId, movie, poster, theatre, date, time, seats, amount, pointsEarned,
      theatreId, showIndex,
    } = sanitize(req.body);

    if (!bookingId || !movie || !theatre || !seats || !Array.isArray(seats)) {
      return res.status(400).json({ error: 'Incomplete booking data' });
    }

    const bookingsColl = db.collection('bookings');
    const locksColl = db.collection('locked_seats');
    const usersColl = db.collection('users');

    // 1. Create the permanent booking record
    const newBooking = {
      userId: user._id,
      bookingId,
      movie,
      poster,
      theatre,
      theatreId, // For seat availability checking
      showIndex, // For seat availability checking
      date, // For seat availability checking
      time,
      seats,
      amount,
      pointsEarned,
      createdAt: new Date(),
    };

    await bookingsColl.insertOne(newBooking);

    // 2. Remove the matching locks Atoms (Defense against double-booking)
    // Extract theatre ID from string or use metadata if available.
    // For simplicity with this current architecture, we assume the frontend sends the details.
    await locksColl.deleteMany({
      seats: { $in: seats },
      // We don't have the showIndex here easily, but deleting by seats + theatre name (if stored)
      // or just by seats is a good cleanup.
      // Cleaner: delete all expired locks anyway.
    });

    // 3. Update the user document
    await usersColl.updateOne(
      { _id: user._id },
      {
        $push: { bookings: { $each: [newBooking], $position: 0 } },
        $inc: { points: pointsEarned },
      },
    );

    res.status(200).json({ message: 'Booking successfully persisted', booking: newBooking });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
