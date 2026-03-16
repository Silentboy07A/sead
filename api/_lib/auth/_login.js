const { connectToDatabase } = require('../utils/db');
const bcrypt = require('bcryptjs');
const { signToken, buildCookieHeader } = require('../utils/jwt');
const sanitize = require('../utils/sanitize');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = sanitize(req.body);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Find user by email
        const user = await usersCollection.findOne({ email });
        
        // Anti-Timing Attack: Always perform a bcrypt comparison (CodeRabbit)
        // If user not found, compare a dummy hash to keep execution time consistent
        const DUMMY_HASH = '$2a$10$ZyP8pXG5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5'; // Valid-looking bcrypt hash
        const passwordToCompare = user ? user.password : DUMMY_HASH;
        const isMatch = await bcrypt.compare(password, passwordToCompare);

        // Check verification status (CodeRabbit: prevent credential leakage)
        const canLogin = user && isMatch && user.isVerified !== false;

        if (!canLogin) {
            // Random jitter to further obfuscate timing (10-50ms)
            await new Promise(r => setTimeout(r, 10 + Math.random() * 40));
            
            if (user && isMatch && user.isVerified === false) {
                 return res.status(403).json({ error: 'Please verify your email before logging in.' });
            }
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { last_login: new Date() } }
        );

        // Issue JWT cookie
        const token = signToken(user._id);
        res.setHeader('Set-Cookie', buildCookieHeader(token));

        res.status(200).json({
            message: 'Login successful!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin || false,
                bookings: user.bookings || []
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
