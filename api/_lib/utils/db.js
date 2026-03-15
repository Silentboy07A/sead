require('dotenv').config();
const { MongoClient } = require('mongodb');

// Get the connection string from environment variables
const MONGODB_URI = (process.env.MONGODB_URI || '').trim();

// Cached connection pool
let cachedClient = null;
let cachedDb = null;

// MONGODB_URI is checked inside connectToDatabase to prevent module-level crashes
async function connectToDatabase() {
    const uri = (process.env.MONGODB_URI || '').trim();
    if (!uri) {
        throw new Error('MONGODB_URI environment variable is missing.');
    }

    // If the database connection is cached, return it
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    // Connect to cluster
    const client = new MongoClient(uri);
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
