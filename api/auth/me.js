const { connectToDatabase } = require('../utils/db');
const { authMiddleware } = require('../utils/jwt');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { db } = await connectToDatabase();
        const user = await authMiddleware(req, db);

        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                picture: user.picture || null,
                isAdmin: user.isAdmin || false,
                bookings: user.bookings || []
            }
        });

    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
