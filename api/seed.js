const { connectToDatabase } = require('./utils/db');

// --- HARDCODED DATA TO SEED ---
const MOVIES_SEED = [
    { _id: 1, title: "Sinners", genre: "Thriller", language: "English", rating: 8.7, duration: "2h 17m", description: "Trying to leave their troubled lives behind, twin brothers return to their hometown to start again, only to discover that an even greater evil is waiting to welcome them back.", poster: "https://image.tmdb.org/t/p/w500/tgCfQmMJQdMgjclPMbMbMFOSLkP.jpg" },
    { _id: 2, title: "Superman", genre: "Action", language: "English", rating: 8.3, duration: "2h 32m", description: "Superman, a cub reporter in Metropolis, must balance his heritage with his human upbringing as the hero of Metropolis in James Gunn's DC Universe.", poster: "https://image.tmdb.org/t/p/w500/sJFnKOlRfJCHCmMFcAo9eJkTajI.jpg" },
    { _id: 3, title: "Avatar: Fire and Ash", genre: "Sci-Fi", language: "English", rating: 8.5, duration: "3h 2m", description: "Jake Sully and Neytiri venture to the volcanic Ash People clan of Pandora, uncovering new wonders and facing an even deadlier threat.", poster: "https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg" },
    { _id: 4, title: "A Minecraft Movie", genre: "Comedy", language: "English", rating: 7.2, duration: "1h 41m", description: "Four misfits are pulled through a portal into the Overworld, a bizarre cubic wonderland that thrives on imagination and must overcome it.", poster: "https://image.tmdb.org/t/p/w500/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg" },
    { _id: 5, title: "Wicked: For Good", genre: "Drama", language: "English", rating: 8.1, duration: "2h 40m", description: "The epic conclusion follows Elphaba's transformation into the Wicked Witch as political strife threatens to tear Oz apart.", poster: "https://image.tmdb.org/t/p/w500/tVnMCFf4a0sLKjYILc6bOh0c6nC.jpg" },
    { _id: 6, title: "The Running Man", genre: "Action", language: "English", rating: 7.9, duration: "2h 10m", description: "In a dystopian America, a desperate man enters a deadly game show where convicted criminals must survive to win freedom.", poster: "https://image.tmdb.org/t/p/w500/mCl4JMjb3CdDZJAxblBVjR0EUqo.jpg" },
    { _id: 7, title: "Lilo & Stitch", genre: "Comedy", language: "English", rating: 7.8, duration: "1h 48m", description: "A live-action reimagining of the beloved story about a lonely Hawaiian girl and the mischievous alien experiment who becomes her best friend.", poster: "https://image.tmdb.org/t/p/w500/2Mo4qFBqYEhdVqcAn8jEASG2CyW.jpg" },
    { _id: 8, title: "Zootopia 2", genre: "Comedy", language: "English", rating: 8.0, duration: "1h 53m", description: "Judy Hopps and Nick Wilde face their biggest case yet when mysterious disappearances threaten the fragile peace of Zootopia.", poster: "https://image.tmdb.org/t/p/w500/65IW0HyPzlFnMBTlGkvnxJkif2R.jpg" },
    { _id: 9, title: "Pushpa 2: The Rule", genre: "Action", language: "Hindi", rating: 7.5, duration: "3h 20m", description: "Pushpa Raj returns as the undisputed king of the red sandalwood syndicate, facing off against SP Bhanwar Singh Shekhawat.", poster: "https://image.tmdb.org/t/p/w500/bnmPFBjbRCgNhVgCGlNVFmqnLdD.jpg" },
    { _id: 10, title: "28 Years Later", genre: "Thriller", language: "English", rating: 8.4, duration: "2h 28m", description: "Almost three decades after the original rage virus outbreak, a group of survivors face a horrifying new evolution of the plague on an isolated island.", poster: "https://image.tmdb.org/t/p/w500/ds5JKCx5Cz2cOfc0u5MoATVqXa3.jpg" },
    { _id: 11, title: "Jurassic World Rebirth", genre: "Sci-Fi", language: "English", rating: 7.6, duration: "2h 15m", description: "Five years after the events of Dominion, a covert team must extract DNA from three massive dinosaurs in the wild.", poster: "https://image.tmdb.org/t/p/w500/6bQLRzMo2jCayvKSan8MBHmL1Mr.jpg" },
    { _id: 12, title: "Sikandar", genre: "Action", language: "Hindi", rating: 7.3, duration: "2h 45m", description: "Salman Khan stars as a fearless warrior navigating a world of power and betrayal in this action-packed blockbuster directed by AR Murugadoss.", poster: "https://image.tmdb.org/t/p/w500/7TulCghb7G3KXRJL5pREaPsxjTu.jpg" }
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
