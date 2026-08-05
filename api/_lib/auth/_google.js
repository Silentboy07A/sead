require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const { connectToDatabase } = require('../utils/db');
const { signToken, buildCookieHeader } = require('../utils/jwt');

// Use env var, cleaned of newlines. Fallback to hardcoded value if env var is missing or corrupted.
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();

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
    const {
      sub: googleId, email, name, picture,
    } = payload;

    // Security: Strip HTML from name to prevent persistent XSS via Google name
    const cleanName = (name || '').replace(/<[^>]*>?/gm, '').trim() || 'Cinephile';

    // 3. Connect to MongoDB
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user exists
    const { mode } = req.body; // mode is 'login' or 'signup'
    const existingUser = await usersCollection.findOne({ email });

    if (mode === 'login' && !existingUser) {
      return res.status(404).json({ error: 'No account found with this email. Please sign up first!' });
    }

    if (mode === 'signup' && existingUser) {
      return res.status(409).json({ error: 'An account already exists with this email. Please log in instead!' });
    }

    // 4. Upsert User (Update if exists, Insert if new)
    const result = await usersCollection.findOneAndUpdate(
      { email },
      {
        $set: {
          name: cleanName,
          picture,
          last_login: new Date(),
        },
        $setOnInsert: {
          googleId,
          isAdmin: false,
          created_at: new Date(),
          genre_preferences: [],
          bookings: [],
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        includeResultMetadata: true,
      },
    );

    const user = result.value || result; // Handle both result styles based on driver version

    if (!user || (!user._id && !result.insertedId)) {
      console.error('Google Sign-In: Database upsert failed to return a user document.', result);
      return res.status(500).json({ error: 'Database error', details: 'Failed to create or update user profile.' });
    }

    const isNewUser = result.lastErrorObject ? !result.lastErrorObject.updatedExisting : false;

    // 5. Issue JWT cookie
    const userId = user._id || result.insertedId;
    const token = signToken(userId);
    res.setHeader('Set-Cookie', buildCookieHeader(token));

    // 6. Send User session back to frontend
    res.status(200).json({
      message: isNewUser ? 'Welcome to CineBook!' : 'Welcome back!',
      isNewUser,
      user: {
        id: userId,
        name: user.name || cleanName,
        email: user.email || email,
        picture: user.picture || picture,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({
      error: 'Google authentication failed',
      details: error.message || 'Internal verification error',
    });
  }
};
