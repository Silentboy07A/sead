const { connectToDatabase } = require('./utils/db');

// --- HARDCODED DATA TO SEED ---
const MOVIES_SEED = [
    // Hollywood / English
    { _id: 1, title: "Sinners", genre: "Thriller", language: "English", rating: 8.7, duration: "2h 17m", description: "Twin brothers return to their hometown, only to discover a greater evil waiting.", poster: "https://image.tmdb.org/t/p/w500/tgCfQmMJQdMgjclPMbMbMFOSLkP.jpg" },
    { _id: 2, title: "Interstellar", genre: "Sci-Fi", language: "English", rating: 8.7, duration: "2h 49m", description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6EwfVnz6u2fMfsHllvA.jpg" },
    { _id: 3, title: "The Dark Knight", genre: "Action", language: "English", rating: 9.0, duration: "2h 32m", description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.", poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDp9QEQvtmvWfsCcHWh.jpg" },
    { _id: 4, title: "Inception", genre: "Sci-Fi", language: "English", rating: 8.8, duration: "2h 28m", description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.", poster: "https://image.tmdb.org/t/p/w500/edv5uSjSNIcCrZQM1YvYvjS79o5.jpg" },
    { _id: 5, title: "Oppenheimer", genre: "Biography", language: "English", rating: 8.4, duration: "3h 00m", description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.", poster: "https://image.tmdb.org/t/p/w500/8GxvB0bsU0Zfj69mQvSzwMT9AWU.jpg" },
    { _id: 6, title: "Avengers: Endgame", genre: "Action", language: "English", rating: 8.4, duration: "3h 01m", description: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to restore balance to the universe.", poster: "https://image.tmdb.org/t/p/w500/or06vSqzWBFscv1qV9Pbi7u9YvK.jpg" },

    // Indian - Hindi
    { _id: 7, title: "Pushpa 2: The Rule", genre: "Action", language: "Hindi", rating: 7.5, duration: "3h 20m", description: "Pushpa Raj returns as the king of the red sandalwood syndicate.", poster: "https://image.tmdb.org/t/p/w500/bnmPFBjbRCgNhVgCGlNVFmqnLdD.jpg" },
    { _id: 8, title: "Animal", genre: "Action", language: "Hindi", rating: 6.3, duration: "3h 21m", description: "A son's obsessive love for his father. Often away on work, the father is unable to comprehend the intensity of his son's love.", poster: "https://image.tmdb.org/t/p/w500/hrm9vS9vSjsyA9u7Z09m9pCu0.jpg" },
    { _id: 9, title: "Stree 2", genre: "Comedy Horror", language: "Hindi", rating: 8.1, duration: "2h 29m", description: "After the events of Stree, the town of Chanderi is being haunted again. This time by a headless entity.", poster: "https://image.tmdb.org/t/p/w500/7Is9o54o55ddf0fb4567888.jpg" },
    { _id: 10, title: "Pathaan", genre: "Action", language: "Hindi", rating: 5.9, duration: "2h 26m", description: "An Indian spy takes on the leader of a group of mercenaries who have nefarious plans to target his homeland.", poster: "https://image.tmdb.org/t/p/w500/m11SjsyA9u7Z09m9pCu0.jpg" },

    // Indian - Tamil
    { _id: 11, title: "Vidaamuyarchi", genre: "Action", language: "Tamil", rating: 8.4, duration: "2h 40m", description: "Ajith Kumar stars in this high-octane action thriller set in Dubai.", poster: "https://image.tmdb.org/t/p/w500/v9Z5vE6TqV3XwW8P4S5s5u9K2Wj.jpg" },
    { _id: 12, title: "Jailer", genre: "Action", language: "Tamil", rating: 7.1, duration: "2h 48m", description: "A retired jailer goes on a manhunt to find his son's killers.", poster: "https://image.tmdb.org/t/p/w500/pA2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },
    { _id: 13, title: "Leo", genre: "Action", language: "Tamil", rating: 7.2, duration: "2h 44m", description: "A mild-mannered cafe owner becomes a local hero, but old secrets catch up with him.", poster: "https://image.tmdb.org/t/p/w500/os9Z5vE6TqV3XwW8P4S5s5u9K2Wj.jpg" },
    { _id: 14, title: "Vikram", genre: "Action", language: "Tamil", rating: 8.3, duration: "2h 55m", description: "A special agent investigates a murder committed by a masked group of serial killers.", poster: "https://image.tmdb.org/t/p/w500/mA2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },

    // Indian - Telugu
    { _id: 15, title: "RRR", genre: "Action", language: "Telugu", rating: 7.8, duration: "3h 7m", description: "A fictitious story about two legendary revolutionaries and their journey away from home.", poster: "https://image.tmdb.org/t/p/w500/nSbtQp0XqYn5E4v8pYInPny9XGk.jpg" },
    { _id: 16, title: "Kalki 2898 AD", genre: "Sci-Fi", language: "Telugu", rating: 7.6, duration: "3h 01m", description: "In a post-apocalyptic world, a new avatar rises to protect the world from evil forces.", poster: "https://image.tmdb.org/t/p/w500/6A2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },
    { _id: 17, title: "Salaar: Part 1 - Ceasefire", genre: "Action", language: "Telugu", rating: 6.5, duration: "2h 55m", description: "A gang leader makes a promise to a dying friend and takes on other criminal gangs.", poster: "https://image.tmdb.org/t/p/w500/uA2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },

    // Indian - Malayalam
    { _id: 18, title: "Manjummel Boys", genre: "Survival", language: "Malayalam", rating: 8.6, duration: "2h 15m", description: "A group of friends get into a daring rescue mission to save their friend from Guna Caves.", poster: "https://image.tmdb.org/t/p/w500/8A2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },
    { _id: 19, title: "Bramayugam", genre: "Horror", language: "Malayalam", rating: 8.2, duration: "2h 19m", description: "A folk singer in 17th century Malabar narrowly escapes a slave market and discovers a traditional house with a mysterious owner.", poster: "https://image.tmdb.org/t/p/w500/0A2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },

    // International - East Asian
    { _id: 20, title: "Parasite", genre: "Thriller", language: "Korean", rating: 9.2, duration: "2h 12m", description: "Greed and class discrimination threaten the relationship between the wealthy Park family and the destitute Kim clan.", poster: "https://image.tmdb.org/t/p/w500/7IiTTjMvIS7v9Z7u9er9Y69YtZt.jpg" },
    { _id: 21, title: "Train to Busan", genre: "Horror", language: "Korean", rating: 7.6, duration: "1h 58m", description: "While a zombie virus breaks out in South Korea, passengers struggle to survive on the train from Seoul to Busan.", poster: "https://image.tmdb.org/t/p/w500/mSbtQp0XqYn5E4v8pYInPny9XGk.jpg" },
    { _id: 22, title: "Spirited Away", genre: "Anime", language: "Japanese", rating: 8.6, duration: "2h 5m", description: "A 10-year-old girl wanders into a world ruled by gods, witches, and spirits.", poster: "https://image.tmdb.org/t/p/w500/39wmItS9vSjsyA9u7Z09m9pCu0.jpg" },
    { _id: 23, title: "Your Name", genre: "Romance", language: "Japanese", rating: 8.4, duration: "1h 46m", description: "Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?", poster: "https://image.tmdb.org/t/p/w500/q719m-S9vSjsyA9u7Z09m9pCu0.jpg" },
    { _id: 24, title: "Demon Slayer: Mugen Train", genre: "Anime", language: "Japanese", rating: 8.3, duration: "1h 57m", description: "Tanjiro and his companions join the Flame Hashira Kyojuro Rengoku on a train.", poster: "https://image.tmdb.org/t/p/w500/hK2kS5vE8TqV3XwW8P4S5s5u9K2Wj.jpg" },

    // International - Spanish & Other
    { _id: 25, title: "The Platform", genre: "Sci-Fi", language: "Spanish", rating: 7.0, duration: "1h 34m", description: "A vertical prison with one food platform and two prisoners per level.", poster: "https://image.tmdb.org/t/p/w500/8m9SjsyA9u7Z09m9pCu0.jpg" },
    { _id: 26, title: "Money Heist: The Phenomenon", genre: "Documentary", language: "Spanish", rating: 7.6, duration: "1h 36m", description: "A look at how the Spanish series became a global sensation.", poster: "https://image.tmdb.org/t/p/w500/8m9SjsyA9u7Z09m9pCu0.jpg" }
];

const THEATRES_SEED = [
    { _id: 1, name: "PVR IMAX Phoenix", location: "Lower Parel", city: "Mumbai", shows: [{ time: "10:30 AM", format: "IMAX" }, { time: "1:45 PM", format: "3D" }, { time: "5:00 PM", format: "IMAX" }, { time: "8:30 PM", format: "2D" }, { time: "10:45 PM", format: "3D" }] },
    { _id: 2, name: "INOX Megaplex", location: "Malad West", city: "Mumbai", shows: [{ time: "11:00 AM", format: "2D" }, { time: "2:15 PM", format: "3D" }, { time: "6:00 PM", format: "2D" }, { time: "9:30 PM", format: "3D" }] },
    { _id: 3, name: "Cinepolis DLF", location: "Vasant Kunj", city: "Delhi", shows: [{ time: "9:30 AM", format: "2D" }, { time: "12:45 PM", format: "IMAX" }, { time: "4:00 PM", format: "3D" }, { time: "7:15 PM", format: "IMAX" }, { time: "10:30 PM", format: "2D" }] },
    { _id: 4, name: "PVR Orion Mall", location: "Rajajinagar", city: "Bangalore", shows: [{ time: "10:00 AM", format: "3D" }, { time: "1:30 PM", format: "2D" }, { time: "5:30 PM", format: "IMAX" }, { time: "9:00 PM", format: "2D" }] },
    { _id: 5, name: "SPI Palazzo", location: "Anna Nagar", city: "Chennai", shows: [{ time: "11:30 AM", format: "2D" }, { time: "3:00 PM", format: "3D" }, { time: "6:30 PM", format: "2D" }, { time: "9:45 PM", format: "IMAX" }] },
    { _id: 6, name: "Prasads IMAX", location: "Khairatabad", city: "Hyderabad", shows: [{ time: "10:00 AM", format: "IMAX" }, { time: "1:30 PM", format: "2D" }, { time: "5:30 PM", format: "IMAX" }, { time: "9:00 PM", format: "2D" }] },
    { _id: 7, name: "Asian Satyam Mall", location: "Ameerpet", city: "Hyderabad", shows: [{ time: "11:00 AM", format: "2D" }, { time: "2:15 PM", format: "3D" }, { time: "6:00 PM", format: "2D" }, { time: "9:30 PM", format: "3D" }] },
    { _id: 8, name: "South City INOX", location: "Prince Anwar Shah Rd", city: "Kolkata", shows: [{ time: "11:30 AM", format: "2D" }, { time: "3:00 PM", format: "3D" }, { time: "6:30 PM", format: "2D" }, { time: "9:45 PM", format: "IMAX" }] }
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
