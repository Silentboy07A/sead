const { connectToDatabase } = require('../utils/db');
const { authMiddleware } = require('../utils/jwt');

module.exports = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        const user = await authMiddleware(req, db);

        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const bookingsColl = db.collection('bookings');
        const allBookings = await bookingsColl.find({}).toArray();

        let totalRevenue = 0;
        let totalTickets = 0;
        const movieStats = {};

        allBookings.forEach(b => {
            const amount = Number(b.amount) || 0;
            const seatsCount = Array.isArray(b.seats) ? b.seats.length : 0;
            
            totalRevenue += amount;
            totalTickets += seatsCount;

            const mName = b.movie || 'Unknown Movie';
            if (!movieStats[mName]) {
                movieStats[mName] = { title: mName, ticketsSold: 0, revenue: 0 };
            }
            movieStats[mName].ticketsSold += seatsCount;
            movieStats[mName].revenue += amount;
        });

        const topMovies = Object.values(movieStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        return res.status(200).json({
            totalRevenue,
            totalTickets,
            topMovies
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
