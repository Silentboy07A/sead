const { connectToDatabase } = require('../utils/db');
const { authMiddleware } = require('../utils/jwt');

module.exports = async (req, res) => {
    const { db } = await connectToDatabase();

    // Auth check
    const user = await authMiddleware(req, db);
    if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const theatresCollection = db.collection('theatres');

    // GET — List all theatres
    if (req.method === 'GET') {
        const theatres = await theatresCollection.find({}).sort({ _id: -1 }).toArray();
        return res.status(200).json(theatres);
    }

    // POST — Add new theatre
    if (req.method === 'POST') {
        const { name, location, city, shows } = req.body;
        if (!name || !location || !city) {
            return res.status(400).json({ error: 'Name, location, and city are required' });
        }

        const lastTheatre = await theatresCollection.find({}).sort({ _id: -1 }).limit(1).toArray();
        const newId = lastTheatre.length > 0 ? lastTheatre[0]._id + 1 : 1;

        const newTheatre = {
            _id: newId,
            name,
            location,
            city,
            shows: shows || []
        };

        await theatresCollection.insertOne(newTheatre);
        return res.status(201).json({ message: 'Theatre added', theatre: newTheatre });
    }

    // PUT — Update theatre
    if (req.method === 'PUT') {
        const { _id, ...updates } = req.body;
        if (!_id) return res.status(400).json({ error: 'Theatre _id is required' });

        const result = await theatresCollection.updateOne({ _id }, { $set: updates });
        if (result.matchedCount === 0) return res.status(404).json({ error: 'Theatre not found' });
        return res.status(200).json({ message: 'Theatre updated' });
    }

    // DELETE — Delete theatre
    if (req.method === 'DELETE') {
        const { _id } = req.body;
        if (!_id) return res.status(400).json({ error: 'Theatre _id is required' });

        const result = await theatresCollection.deleteOne({ _id });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Theatre not found' });
        return res.status(200).json({ message: 'Theatre deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
