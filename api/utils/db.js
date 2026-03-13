require('dotenv').config();
const { MongoClient } = require('mongodb');

// Get the connection string from environment variables
const MONGODB_URI = (process.env.MONGODB_URI || '').trim();

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

    // Connect to cluster (no deprecated options needed in MongoDB driver v5+)
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    // Select the database explicitly
    const dbName = process.env.MONGODB_DB || 'cintic';
    const db = client.db(dbName);

    // Cache the connection and db reference
    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

module.exports = { connectToDatabase };
