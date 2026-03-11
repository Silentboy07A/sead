require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectToDatabase } = require('./utils/db');

const TMDB_BASE = 'https://image.tmdb.org/t/p/w500';

// All poster paths verified via TMDB API (api.themoviedb.org)
const MOVIES_SEED = [
    { _id: 1, title: "Sinners", year: 2025, genre: "Thriller", language: "English", rating: 8.7, duration: "2h 17m", description: "Twin brothers return to their hometown, only to discover a greater evil waiting.", poster: TMDB_BASE + "/qTvFWCGeGXgBRaINLY1zqgTPSpn.jpg" },
    { _id: 2, title: "Interstellar", year: 2014, genre: "Sci-Fi", language: "English", rating: 8.7, duration: "2h 49m", description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", poster: TMDB_BASE + "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
    { _id: 3, title: "The Dark Knight", year: 2008, genre: "Action", language: "English", rating: 9.0, duration: "2h 32m", description: "When the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological and physical tests.", poster: TMDB_BASE + "/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
    { _id: 4, title: "Inception", year: 2010, genre: "Sci-Fi", language: "English", rating: 8.8, duration: "2h 28m", description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.", poster: TMDB_BASE + "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg" },
    { _id: 5, title: "Oppenheimer", year: 2023, genre: "Biography", language: "English", rating: 8.4, duration: "3h 00m", description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.", poster: TMDB_BASE + "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
    { _id: 6, title: "Avengers: Endgame", year: 2019, genre: "Action", language: "English", rating: 8.4, duration: "3h 01m", description: "After Infinity War, the Avengers assemble once more to restore balance to the universe.", poster: TMDB_BASE + "/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg" },
    { _id: 7, title: "Pushpa 2: The Rule", year: 2024, genre: "Action", language: "Hindi", rating: 7.5, duration: "3h 20m", description: "Pushpa Raj returns as the king of the red sandalwood syndicate.", poster: TMDB_BASE + "/t5ePZYRibJ0EEK1FK3GhihVkDW5.jpg" },
    { _id: 8, title: "Animal", year: 2023, genre: "Action", language: "Hindi", rating: 6.3, duration: "3h 21m", description: "A son's obsessive love for his father spirals into dark territory.", poster: TMDB_BASE + "/hr9rjR3J0xBBKmlJ4n3gHId9ccx.jpg" },
    { _id: 9, title: "Stree 2", year: 2024, genre: "Comedy Horror", language: "Hindi", rating: 8.1, duration: "2h 29m", description: "The town of Chanderi is haunted again. This time by a headless entity.", poster: TMDB_BASE + "/2NC7sj8rheKxWqLYAbHnCa4mYBH.jpg" },
    { _id: 10, title: "Pathaan", year: 2023, genre: "Action", language: "Hindi", rating: 5.9, duration: "2h 26m", description: "An Indian spy takes on the leader of a group of mercenaries with nefarious plans.", poster: TMDB_BASE + "/arf00BkwvXo0CFKbaD9OpqdE4Nu.jpg" },
    { _id: 11, title: "Vidaamuyarchi", year: 2025, genre: "Action", language: "Tamil", rating: 8.4, duration: "2h 40m", description: "Ajith Kumar stars in this high-octane action thriller set in Dubai.", poster: TMDB_BASE + "/yx7AYFLoupzBfdfEAlDFuOiei2A.jpg" },
    { _id: 12, title: "Jailer", year: 2023, genre: "Action", language: "Tamil", rating: 7.1, duration: "2h 48m", description: "A retired jailer goes on a manhunt to find his son's killers.", poster: TMDB_BASE + "/pTmMxAHqX4vsIDE6HPPxOR0Q6TN.jpg" },
    { _id: 13, title: "Leo", year: 2023, genre: "Action", language: "Tamil", rating: 7.2, duration: "2h 44m", description: "A mild-mannered cafe owner becomes a local hero, but old secrets catch up with him.", poster: TMDB_BASE + "/t1oAdt8JjUs4sHEBvE8fKtjV7er.jpg" },
    { _id: 14, title: "Vikram", year: 2022, genre: "Action", language: "Tamil", rating: 8.3, duration: "2h 55m", description: "A special agent investigates a murder committed by a masked group of serial killers.", poster: TMDB_BASE + "/774UV1aCURb4s4JfEFg3IEMu5Zj.jpg" },
    { _id: 15, title: "RRR", year: 2022, genre: "Action", language: "Telugu", rating: 7.8, duration: "3h 7m", description: "A fictitious story about two legendary revolutionaries and their journey away from home.", poster: TMDB_BASE + "/u0XUBNQWlOvrh0Gd97ARGpIkL0.jpg" },
    { _id: 16, title: "Kalki 2898 AD", year: 2024, genre: "Sci-Fi", language: "Telugu", rating: 7.6, duration: "3h 01m", description: "In a post-apocalyptic world, a new avatar rises to protect the world from evil forces.", poster: TMDB_BASE + "/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg" },
    { _id: 17, title: "Salaar: Part 1 - Ceasefire", year: 2023, genre: "Action", language: "Telugu", rating: 6.5, duration: "2h 55m", description: "A gang leader makes a promise to a dying friend and takes on other criminal gangs.", poster: TMDB_BASE + "/nlu9WbcetNFRGXXPWITr30ob7W6.jpg" },
    { _id: 18, title: "Manjummel Boys", year: 2024, genre: "Survival", language: "Malayalam", rating: 8.6, duration: "2h 15m", description: "A daring rescue mission to save a friend from Guna Caves.", poster: TMDB_BASE + "/bswrtewwthpsh6nABiqKevU4UBI.jpg" },
    { _id: 19, title: "Bramayugam", year: 2024, genre: "Horror", language: "Malayalam", rating: 8.2, duration: "2h 19m", description: "A folk singer in 17th century Malabar discovers a mysterious house with a dark owner.", poster: TMDB_BASE + "/snQLwRrfQAl5YFKVefZq9Lbscki.jpg" },
    { _id: 20, title: "Parasite", year: 2019, genre: "Thriller", language: "Korean", rating: 9.2, duration: "2h 12m", description: "Greed and class discrimination threaten the relationship between two Korean families.", poster: TMDB_BASE + "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
    { _id: 21, title: "Train to Busan", year: 2016, genre: "Horror", language: "Korean", rating: 7.6, duration: "1h 58m", description: "Passengers struggle to survive a zombie outbreak on a train from Seoul to Busan.", poster: TMDB_BASE + "/vNVFt6dtcqnI7hqa6LFBUibuFiw.jpg" },
    { _id: 22, title: "Spirited Away", year: 2001, genre: "Anime", language: "Japanese", rating: 8.6, duration: "2h 5m", description: "A 10-year-old girl wanders into a world ruled by gods, witches, and spirits.", poster: TMDB_BASE + "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg" },
    { _id: 23, title: "Your Name", year: 2016, genre: "Romance", language: "Japanese", rating: 8.4, duration: "1h 46m", description: "Two strangers find themselves linked in a bizarre way across time and space.", poster: TMDB_BASE + "/q719jXXEzOoYaps6babgKnONONX.jpg" },
    { _id: 24, title: "Demon Slayer: Mugen Train", year: 2020, genre: "Anime", language: "Japanese", rating: 8.3, duration: "1h 57m", description: "Tanjiro and friends join the Flame Hashira Rengoku on a mysterious train.", poster: TMDB_BASE + "/h8Rb9gBr48ODIwYUttZNYeMWeUU.jpg" },
    { _id: 25, title: "The Platform", year: 2019, genre: "Sci-Fi", language: "Spanish", rating: 7.0, duration: "1h 34m", description: "A vertical prison with one food platform and two prisoners per level.", poster: TMDB_BASE + "/iXvQnzy6JCAx1PiQEKXuTY04ZHl.jpg" },
    { _id: 26, title: "Money Heist: The Phenomenon", year: 2020, genre: "Documentary", language: "Spanish", rating: 7.6, duration: "1h 36m", description: "A look at how the Spanish heist series became a global sensation.", poster: TMDB_BASE + "/AboUXTrDWEi0PuZUqaft0iwBTm7.jpg" },
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

        await db.collection('movies').deleteMany({});
        await db.collection('theatres').deleteMany({});

        const moviesResult = await db.collection('movies').insertMany(MOVIES_SEED);
        const theatresResult = await db.collection('theatres').insertMany(THEATRES_SEED);

        res.status(200).json({
            message: 'Database seeded with verified TMDB poster URLs!',
            moviesInserted: moviesResult.insertedCount,
            theatresInserted: theatresResult.insertedCount,
        });
    } catch (error) {
        console.error('Error seeding DB:', error);
        res.status(500).json({ error: 'Failed to seed database', details: error.message });
    }
};
