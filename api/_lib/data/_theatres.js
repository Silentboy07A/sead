require('dotenv').config();
const { connectToDatabase } = require('../utils/db');

module.exports = async (req, res) => {
  try {
    const { db } = await connectToDatabase();

    // Query all theatres from the "theatres" collection
    const theatres = await db.collection('theatres').find({}).toArray();

    // Map _id to id similar to movies
    const formattedTheatres = theatres.map((t) => ({ ...t, id: t._id, _id: undefined }));

    res.status(200).json(formattedTheatres);
  } catch (error) {
    console.error('Error in /api/theatres:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
