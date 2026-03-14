const { connectToDatabase } = require('./db');

async function initDatabase() {
  console.log('--- Initializing Database Indices ---');
  try {
    const { db } = await connectToDatabase();
    
    // 1. Locked Seats Indices
    const locks = db.collection('locked_seats');
    
    // TTL Index (Auto-delete expired locks)
    console.log('Ensuring TTL index on locked_seats.expiresAt...');
    await locks.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
    
    // Unique Index (Prevent race conditions/dual-booking)
    console.log('Ensuring Unique index on locked_seats keys...');
    await locks.createIndex(
      { theatreId: 1, showIndex: 1, date: 1, seatId: 1 }, 
      { unique: true, name: "unique_seat_lock" }
    );

    // 2. User Indices
    const users = db.collection('users');
    console.log('Ensuring Unique index on users.email...');
    await users.createIndex({ email: 1 }, { unique: true });

    console.log('✓ Database initialization complete.');
  } catch (err) {
    console.error('✗ Index Setup Failed:', err.message);
    throw err;
  }
}

if (require.main === module) {
  initDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { initDatabase };
