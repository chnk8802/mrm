import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';

// describe = a labeled group of tests
describe('test database', () => {
  beforeAll(connectTestDb);      // once, before all tests in this file
  afterAll(disconnectTestDb);    // once, after all tests finish
  beforeEach(clearTestDb);       // before EVERY test, so tests can't affect each other

  // it = one test. Name it as a sentence: "it <does something>"
  it('can write and read a document', async () => {
    const col = mongoose.connection.collection('things');
    await col.insertOne({ name: 'hello' });            // Act

    const found = await col.findOne({ name: 'hello' });
    expect(found.name).toBe('hello');                  // Assert
  });

  it('starts each test with an empty database', async () => {
    const count = await mongoose.connection.collection('things').countDocuments();
    expect(count).toBe(0); // the doc from the previous test is gone
  });
});