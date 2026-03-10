const { connectToDatabase } = require('./utils/db');

// --- HARDCODED DATA TO SEED ---
const MOVIES_SEED = [
    // Hollywood / English
    { _id: 1, title: "Sinners", genre: "Thriller", language: "English", rating: 8.7, duration: "2h 17m", description: "Twin brothers return to their hometown, only to discover a greater evil waiting.", poster: "https://image.tmdb.org/t/p/w500/tgCfQmMJQdMgjclPMbMbMFOSLkP.jpg" },
    { _id: 2, title: "Superman", genre: "Action", language: "English", rating: 8.3, duration: "2h 32m", description: "The origin story of the Man of Steel in James Gunn's DC Universe.", poster: "https://image.tmdb.org/t/p/w500/sJFnKOlRfJCHCmMFcAo9eJkTajI.jpg" },
    { _id: 3, title: "Avatar: Fire and Ash", genre: "Sci-Fi", language: "English", rating: 8.5, duration: "3h 2m", description: "Jake Sully and Neytiri face the Ash People of Pandora.", poster: "https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg" },

    // Indian - Hindi
    { _id: 9, title: "Pushpa 2: The Rule", genre: "Action", language: "Hindi", rating: 7.5, duration: "3h 20m", description: "Pushpa Raj returns as the king of the red sandalwood syndicate.", poster: "https://image.tmdb.org/t/p/w500/bnmPFBjbRCgNhVgCGlNVFmqnLdD.jpg" },
    { _id: 12, title: "Sikandar", genre: "Action", language: "Hindi", rating: 7.3, duration: "2h 45m", description: "A fearless warrior navigates power and betrayal.", poster: "https://image.tmdb.org/t/p/w500/7TulCghb7G3KXRJL5pREaPsxjTu.jpg" },
    { _id: 13, title: "The Bull", genre: "Action", language: "Hindi", rating: 8.2, duration: "2h 30m", description: "Based on a true story of bravery and sacrifice in the Indian Army.", poster: "https://image.tmdb.org/t/p/w500/nSbtQp0XqYn5E4v8pYInPny9XGk.jpg" },

    // Indian - Tamil
    { _id: 14, title: "Vidaamuyarchi", genre: "Action", language: "Tamil", rating: 8.4, duration: "2h 40m", description: "Ajith Kumar stars in this high-octane action thriller set in Dubai.", poster: "https://image.tmdb.org/t/p/w500/v9Z5vE6TqV3XwW8P4S5s5u9K2Wj.jpg" },
    { _id: 15, title: "Good Bad Ugly", genre: "Action", language: "Tamil", rating: 8.1, duration: "2h 35m", description: "A multi-layered action drama exploring the shades of a man's character.", poster: "https://image.tmdb.org/t/p/w500/pA2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },
    { _id: 16, title: "Thug Life", genre: "Drama", language: "Tamil", rating: 8.9, duration: "2h 50m", description: "Mani Ratnam and Kamal Haasan reunite for this epic gangster saga.", poster: "https://image.tmdb.org/t/p/w500/8K2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },

    // Indian - Telugu
    { _id: 17, title: "Game Changer", genre: "Political Thriller", language: "Telugu", rating: 8.0, duration: "2h 55m", description: "An honest IAS officer takes on the corrupt political system.", poster: "https://image.tmdb.org/t/p/w500/uA2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },
    { _id: 18, title: "Devara Part 1", genre: "Action", language: "Telugu", rating: 7.9, duration: "2h 58m", description: "A coastal saga about a man who stands against injustice.", poster: "https://image.tmdb.org/t/p/w500/6A2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },

    // International - East Asian
    { _id: 19, title: "Parasite", genre: "Thriller", language: "Korean", rating: 9.2, duration: "2h 12m", description: "Greed and class discrimination threaten the relationship between the wealthy Park family and the destitute Kim clan.", poster: "https://image.tmdb.org/t/p/w500/7IiTTjMvIS7v9Z7u9er9Y69YtZt.jpg" },
    { _id: 20, title: "Demon Slayer: Infinity Castle", genre: "Anime", language: "Japanese", rating: 9.0, duration: "1h 50m", description: "The final battle against Muzan Kibutsuji begins in the Infinity Castle.", poster: "https://image.tmdb.org/t/p/w500/hK2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },
    { _id: 21, title: "Godzilla Minus One", genre: "Sci-Fi", language: "Japanese", rating: 8.6, duration: "2h 4m", description: "In post-war Japan, a new terror rises in the form of Godzilla.", poster: "https://image.tmdb.org/t/p/w500/hkxxM9p4B8VMju87vV9vXubgEz.jpg" }
];

const THEATRES_SEED = [
    { _id: 1, name: "PVR IMAX Phoenix", location: "Lower Parel", city: "Mumbai", shows: [{ time: "10:30 AM", format: "IMAX" }, { time: "1:45 PM", format: "3D" }, { time: "5:00 PM", format: "IMAX" }, { time: "8:30 PM", format: "2D" }, { time: "10:45 PM", format: "3D" }] },
    { _id: 2, name: "INOX Megaplex", location: "Malad West", city: "Mumbai", shows: [{ time: "11:00 AM", format: "2D" }, { time: "2:15 PM", format: "3D" }, { time: "6:00 PM", format: "2D" }, { time: "9:30 PM", format: "3D" }] },
    { _id: 3, name: "Cinepolis DLF", location: "Vasant Kunj", city: "Delhi", shows: [{ time: "9:30 AM", format: "2D" }, { time: "12:45 PM", format: "IMAX" }, { time: "4:00 PM", format: "3D" }, { time: "7:15 PM", format: "IMAX" }, { time: "10:30 PM", format: "2D" }] },
    { _id: 4, name: "PVR Orion Mall", location: "Rajajinagar", city: "Bangalore", shows: [{ time: "10:00 AM", format: "3D" }, { time: "1:30 PM", format: "2D" }, { time: "5:30 PM", format: "IMAX" }, { time: "9:00 PM", format: "2D" }] },
    { _id: 5, name: "SPI Palazzo", location: "Anna Nagar", city: "Chennai", shows: [{ time: "11:30 AM", format: "2D" }, { time: "3:00 PM", format: "3D" }, { time: "6:30 PM", format: "2D" }, { time: "9:45 PM", format: "IMAX" }] }
];

module.exports = async (req, res) => {
    try {
        const { db } = await connectToDatabase();

        // 1. Clear existing data to prevent duplicates
        await db.collection('movies').deleteMany({});
        await db.collection('theatres').deleteMany({});

        // 2. Insert movie seed data
        const moviesResult = await db.collection('movies').insertMany(MOVIES_SEED);

        // 3. Insert theatre seed data
        const theatresResult = await db.collection('theatres').insertMany(THEATRES_SEED);

        res.status(200).json({
            message: 'Database seeded successfully!',
            moviesInserted: moviesResult.insertedCount,
            theatresInserted: theatresResult.insertedCount
        });
    } catch (error) {
        console.error('Error seeding DB:', error);
        res.status(500).json({ error: 'Failed to seed database' });
    }
};
