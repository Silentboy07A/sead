const { connectToDatabase } = require('../utils/db');
const bcrypt = require('bcryptjs');
const { signToken, buildCookieHeader } = require('../utils/jwt');
const sanitize = require('../utils/sanitize');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, name } = sanitize(req.body);

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Robust email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Password complexity (matches frontend)
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (password.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            return res.status(400).json({ error: 'Password does not meet complexity requirements' });
        }

        if (name.trim().length < 3) {
            return res.status(400).json({ error: 'Name must be at least 3 characters' });
        }

        // Security: Strip HTML from name to prevent persistent XSS
        const cleanName = name.replace(/<[^>]*>?/gm, '').trim();
        if (cleanName.length < 3) {
            return res.status(400).json({ error: 'Name contains invalid characters or is too short after sanitization' });
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
            name: cleanName,
            email,
            password: hashedPassword,
            isAdmin: false,
            created_at: new Date(),
            last_login: new Date(),
            genre_preferences: [],
            bookings: []
        };

        const result = await usersCollection.insertOne(newUser);

        // Issue JWT cookie
        const token = signToken(result.insertedId);
        res.setHeader('Set-Cookie', buildCookieHeader(token));

        res.status(201).json({
            message: 'Registration successful!',
            user: {
                id: result.insertedId,
                name: newUser.name,
                email: newUser.email,
                isAdmin: false
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
