const { connectToDatabase } = require('../utils/db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            created_at: new Date(),
            last_login: new Date(),
            genre_preferences: [],
            bookings: []
        };

        const result = await usersCollection.insertOne(newUser);
        
        res.status(201).json({
            message: 'Registration successful!',
            user: {
                id: result.insertedId,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
