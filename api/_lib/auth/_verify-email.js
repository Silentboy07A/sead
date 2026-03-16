const { connectToDatabase } = require('../utils/db');
const crypto = require('crypto');
const sanitize = require('../utils/sanitize');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, token } = sanitize(req.body);

        if (!email || !token) {
            return res.status(400).json({ error: 'Email and token are required' });
        }

        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Hash the incoming token to compare with the one in DB
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await usersCollection.findOne({
            email,
            verificationToken: tokenHash,
            verificationExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        // Update user status
        await usersCollection.updateOne(
            { _id: user._id },
            { 
                $set: { isVerified: true },
                $unset: { verificationToken: "", verificationExpires: "" }
            }
        );

        res.status(200).json({ 
            message: 'Email verified successfully! You can now log in.',
            email: user.email
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error during verification' });
    }
};
