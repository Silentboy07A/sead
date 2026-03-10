const { MongoClient } = require('mongodb');

// Get the connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Cached connection pool
let cachedClient = null;
let cachedDb = null;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

async function connectToDatabase() {
    // If the database connection is cached, return it
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    // Set up connection options
    const opts = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    };

    // Connect to cluster
    const client = new MongoClient(MONGODB_URI, opts);
    await client.connect();

    // Select the database "cintic" explicitly
    const db = client.db('cintic');

    // Cache the connection and db reference
    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

module.exports = { connectToDatabase };
