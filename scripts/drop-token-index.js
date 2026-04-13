// Run with: node scripts/drop-token-index.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const collection = client.db().collection('tokens');

    // List all indexes first
    const indexes = await collection.indexes();
    console.log('\nCurrent token collection indexes:');
    indexes.forEach(idx => console.log(' -', idx.name, JSON.stringify(idx.key), idx.unique ? '(UNIQUE)' : ''));

    // Drop the problematic global unique index on token field
    try {
      await collection.dropIndex('token_1');
      console.log('\n✅ Dropped old global unique index: token_1');
    } catch (e) {
      console.log('\nℹ️  token_1 index not found (already gone or never created):', e.message);
    }

    // Clear all stale OTP tokens so there are no lingering collisions
    const deleted = await collection.deleteMany({ type: 'license-otp' });
    console.log(`🧹 Cleared ${deleted.deletedCount} stale license-otp token(s)`);

    // Show final index list
    const finalIndexes = await collection.indexes();
    console.log('\nFinal token collection indexes:');
    finalIndexes.forEach(idx => console.log(' -', idx.name, JSON.stringify(idx.key), idx.unique ? '(UNIQUE)' : ''));

  } finally {
    await client.close();
    console.log('\nDone.');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
