require('dotenv').config();
const { connectToDatabase } = require('../utils/db');

module.exports = async (req, res) => {
  try {
    const { db } = await connectToDatabase();

    // Query all movies from the "movies" collection
    const movies = await db.collection('movies').find({}).toArray();

    // Map _id to id so frontend doesn't need to change much
    const formattedMovies = movies.map((m) => ({ ...m, id: m._id, _id: undefined }));

    res.status(200).json(formattedMovies);
  } catch (error) {
    console.error('Error in /api/movies:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
