import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Customer from '../models/customer.model.js';
import Organization from '../models/organization.model.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { createOrg, createUser, createCustomer, tokenFor } from './helpers/factories.js';

// Small helper so tests read cleanly
const postRepair = (user, body) =>
  request(app)
    .post('/api/repairs')
    .set('Authorization', `Bearer ${tokenFor(user)}`)
    .send(body);

const repairBody = (customer) => ({
  customer: String(customer._id),
  deviceModel: 'Phone X',
  problem: 'Cracked screen',
  serviceCharge: 500,
});

describe('POST /api/repairs', () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(clearTestDb);

  it('creates a repair and adds the charge to the customer balance', async () => {
    const org = await createOrg('Shop A');
    const admin = await createUser(org, 'admin');
    const customer = await createCustomer(org, 'Alice');

    const res = await postRepair(admin, repairBody(customer));

    expect(res.status).toBe(201);
    expect(res.body.data.repairId).toBe('REP-0001');

    // Check the side effect directly in the DB, not just the response
    const updated = await Customer.findById(customer._id);
    expect(updated.outstandingBalance).toBe(500);
  });

  it('gives each org its own repairId sequence through the API', async () => {
    const orgA = await createOrg('Shop A');
    const orgB = await createOrg('Shop B');
    const adminA = await createUser(orgA, 'admin');
    const adminB = await createUser(orgB, 'admin');
    const custA = await createCustomer(orgA, 'Alice');
    const custB = await createCustomer(orgB, 'Bob');

    await postRepair(adminA, repairBody(custA));
    const resA2 = await postRepair(adminA, repairBody(custA));
    const resB1 = await postRepair(adminB, repairBody(custB));

    expect(resA2.body.data.repairId).toBe('REP-0002');
    expect(resB1.body.data.repairId).toBe('REP-0001');
  });

  it('rejects a customer that belongs to another org', async () => {
    const orgA = await createOrg('Shop A');
    const orgB = await createOrg('Shop B');
    const adminA = await createUser(orgA, 'admin');
    const custB = await createCustomer(orgB, 'Bob');

    const res = await postRepair(adminA, repairBody(custB)); // A uses B's customer

    expect(res.status).toBe(404);
  });

  it('blocks creation when the record count is exactly at the cap', async () => {
  const org = await createOrg('Shop A', { recordCap: 2 });
  const admin = await createUser(org, 'admin');
  const customer = await createCustomer(org, 'Alice');

  // State the assumption explicitly: admin + customer = 2 records = exactly at the cap
  const fresh = await Organization.findById(org._id);
  expect(fresh.subscription.recordCount).toBe(2);

  const res = await postRepair(admin, repairBody(customer));

  expect(res.status).toBe(403);
  expect(res.body.message).toContain('Record limit reached');
});

it('allows creation when one slot is still free', async () => {
  const org = await createOrg('Shop A', { recordCap: 3 });
  const admin = await createUser(org, 'admin');
  const customer = await createCustomer(org, 'Alice');

  const res = await postRepair(admin, repairBody(customer));

  expect(res.status).toBe(201);
});

  it('ignores the cap when capsOverride is on', async () => {
    const org = await createOrg('Shop A', { recordCap: 1, capsOverride: true });
    const admin = await createUser(org, 'admin');
    const customer = await createCustomer(org, 'Alice');

    const res = await postRepair(admin, repairBody(customer));

    expect(res.status).toBe(201);
  });
});