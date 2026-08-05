require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const db = c.db('cintic');
  const r = await db.collection('users').updateMany(
    { email: 'admin@cintic.com' },
    { $set: { isAdmin: true } },
  );
  console.log('Matched:', r.matchedCount, 'Modified:', r.modifiedCount);
  const u = await db.collection('users').findOne({ email: 'admin@cintic.com' });
  console.log('isAdmin now:', u.isAdmin);
  await c.close();
})();
