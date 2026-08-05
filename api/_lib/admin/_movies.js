const { connectToDatabase } = require('../utils/db');
const { authMiddleware } = require('../utils/jwt');
const sanitize = require('../utils/sanitize');

module.exports = async (req, res) => {
  const { db } = await connectToDatabase();

  // Auth check
  const user = await authMiddleware(req, db);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const moviesCollection = db.collection('movies');

  // GET — List all movies
  if (req.method === 'GET') {
    const movies = await moviesCollection.find({}).sort({ _id: -1 }).toArray();
    return res.status(200).json(movies);
  }

  // POST — Add new movie
  if (req.method === 'POST') {
    const {
      title, year, genre, language, rating, duration, description, poster, trailerId,
    } = req.body;
    if (!title || !genre || !language) {
      return res.status(400).json({ error: 'Title, genre, and language are required' });
    }

    // Auto-generate next _id
    const lastMovie = await moviesCollection.find({}).sort({ _id: -1 }).limit(1).toArray();
    const newId = lastMovie.length > 0 ? lastMovie[0]._id + 1 : 1;

    const newMovie = {
      _id: newId,
      title,
      year: year || new Date().getFullYear(),
      genre,
      language,
      rating: rating || 0,
      duration: duration || 'N/A',
      description: description || '',
      poster: poster || '',
      trailerId: trailerId || '',
    };

    await moviesCollection.insertOne(newMovie);
    return res.status(201).json({ message: 'Movie added', movie: newMovie });
  }

  // PUT — Update movie
  if (req.method === 'PUT') {
    const {
      _id, title, year, genre, language, rating, duration, description, poster, trailerId,
    } = sanitize(req.body);
    if (!_id) return res.status(400).json({ error: 'Movie _id is required' });

    const numericId = Number(_id);
    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid movie _id' });

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (year !== undefined) updates.year = year;
    if (genre !== undefined) updates.genre = genre;
    if (language !== undefined) updates.language = language;
    if (rating !== undefined) updates.rating = rating;
    if (duration !== undefined) updates.duration = duration;
    if (description !== undefined) updates.description = description;
    if (poster !== undefined) updates.poster = poster;
    if (trailerId !== undefined) updates.trailerId = trailerId;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const result = await moviesCollection.updateOne({ _id: numericId }, { $set: updates });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Movie not found' });
    return res.status(200).json({ message: 'Movie updated' });
  }

  // DELETE — Delete movie
  if (req.method === 'DELETE') {
    const { _id } = sanitize(req.body);
    if (!_id) return res.status(400).json({ error: 'Movie _id is required' });

    const numericId = Number(_id);
    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid movie _id' });

    const result = await moviesCollection.deleteOne({ _id: numericId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Movie not found' });
    return res.status(200).json({ message: 'Movie deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
