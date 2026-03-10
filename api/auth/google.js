const { connectToDatabase } = require('../utils/db');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
    // If not set, we'll log a warning but keep the route active (returning error when called)
    console.warn('WARNING: GOOGLE_CLIENT_ID is not configured in environment variables.');
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
                    created_at: new Date(),
                    genre_preferences: [],
                    bookings: []
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        const user = result.value || result;

        // 5. Send User session back to frontend
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        });

    } catch (error) {
        console.error('Error verifying Google Token:', error);
        res.status(401).json({ error: 'Invalid or expired Google Token' });
    }
};
