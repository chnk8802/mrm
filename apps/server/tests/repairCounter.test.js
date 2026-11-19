import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { createOrg, createCustomer, createRepair } from './helpers/factories.js';

describe('repairId counter', () => {
  let orgA, orgB, customerA, customerB;

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    await clearTestDb(); // also wipes the counters collection, so every test starts at 0
    orgA = await createOrg('Shop A');
    orgB = await createOrg('Shop B');
    customerA = await createCustomer(orgA, 'Alice');
    customerB = await createCustomer(orgB, 'Bob');
  });

  it('counts up within one org', async () => {
    const first = await createRepair(orgA, customerA);
    const second = await createRepair(orgA, customerA);

    expect(first.repairId).toBe('REP-0001');
    expect(second.repairId).toBe('REP-0002');
  });

  it('gives each org its own independent counter', async () => {
    await createRepair(orgA, customerA);
    await createRepair(orgA, customerA);        // A is now at 2
    const firstOfB = await createRepair(orgB, customerB);

    expect(firstOfB.repairId).toBe('REP-0001'); // B must NOT continue from A's count
  });

  it('never hands out the same id twice, even under concurrency', async () => {
    // Promise.all fires all 5 at the same moment: a race condition test
    const repairs = await Promise.all(
      Array.from({ length: 5 }, () => createRepair(orgA, customerA))
    );

    const ids = repairs.map((r) => r.repairId);
    expect(new Set(ids).size).toBe(5); // a Set drops duplicates; size 5 means all unique
  });
});