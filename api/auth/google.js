require('dotenv').config();
const { connectToDatabase } = require('../utils/db');
const { OAuth2Client } = require('google-auth-library');
const { signToken, buildCookieHeader } = require('../utils/jwt');

// Use env var, cleaned of newlines. Fallback to hardcoded value if env var is missing or corrupted.
const GOOGLE_CLIENT_ID = ((process.env.GOOGLE_CLIENT_ID || '').trim())
    || '554940727049-j2fcom24vrb6ssal0i6om0r4gpap77d1.apps.googleusercontent.com';

if (!GOOGLE_CLIENT_ID) {
    console.warn('WARNING: GOOGLE_CLIENT_ID is not configured.');
}
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Missing credential payload' });
        }

        // 1. Verify the JWT Google sent to the frontend
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });

        // 2. Extract user info
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // 3. Connect to MongoDB
        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Check if user exists
        const { mode } = req.body; // mode is 'login' or 'signup'
        const existingUser = await usersCollection.findOne({ email: email });

        if (mode === 'login' && !existingUser) {
            return res.status(404).json({ error: 'No account found with this email. Please sign up first!' });
        }

        if (mode === 'signup' && existingUser) {
            return res.status(409).json({ error: 'An account already exists with this email. Please log in instead!' });
        }

        // 4. Upsert User (Update if exists, Insert if new)
        const result = await usersCollection.findOneAndUpdate(
            { email: email },
            {
                $set: {
                    name: name,
                    picture: picture,
                    last_login: new Date()
                },
                $setOnInsert: {
                    googleId: googleId,
                    isAdmin: false,
                    created_at: new Date(),
                    genre_preferences: [],
                    bookings: []
                }
            },
            {
                upsert: true,
                returnDocument: 'after',
                includeResultMetadata: true
            }
        );

        const user = result.value;
        const isNewUser = !result.lastErrorObject.updatedExisting;

        // 5. Issue JWT cookie
        const token = signToken(user._id);
        res.setHeader('Set-Cookie', buildCookieHeader(token));

        // 6. Send User session back to frontend
        res.status(200).json({
            message: isNewUser ? 'Welcome to CineBook!' : 'Welcome back!',
            isNewUser: isNewUser,
            user: {
                id: user._id,
                name: user.name || name,
                email: user.email || email,
                picture: user.picture || picture,
                isAdmin: user.isAdmin || false
            }
        });

    } catch (error) {
        console.error('Error verifying Google Token:', error);
        res.status(401).json({
            error: 'Google sign-in failed',
            details: error.message
        });
    }
};
