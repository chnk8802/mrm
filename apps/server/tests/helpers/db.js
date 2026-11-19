import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet;

// A real Mongo that lives in RAM. Replica set because withTransaction requires one.
export async function connectTestDb() {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [
      { args: ['--setParameter', 'maxTransactionLockRequestTimeoutMillis=5000'] },
    ],
  });
  await mongoose.connect(replSet.getUri());

  await Promise.all(
    mongoose.modelNames().map((name) => mongoose.model(name).init())
  );
}

// Wipe every collection. Uses the raw driver (not the models) on purpose,
// so your orgScope plugin hooks don't interfere with cleanup.
export async function clearTestDb() {
  const { collections } = mongoose.connection;
  for (const name in collections) await collections[name].deleteMany({});
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  await replSet.stop();
}