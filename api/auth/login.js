const { connectToDatabase } = require('../utils/db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Find user by email
        const user = await usersCollection.findOne({ email });
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { last_login: new Date() } }
        );

        res.status(200).json({
            message: 'Login successful!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                bookings: user.bookings || []
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
