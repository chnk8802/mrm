import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { createOrg, createUser, createCustomer, tokenFor } from './helpers/factories.js';

describe('org isolation: customers', () => {
  let adminA, customerA, customerB;

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    await clearTestDb();

    // ARRANGE: two separate shops, each with data
    const orgA = await createOrg('Shop A');
    const orgB = await createOrg('Shop B');
    adminA = await createUser(orgA, 'admin');
    customerA = await createCustomer(orgA, 'Alice of A');
    customerB = await createCustomer(orgB, 'Bob of B');
  });

  it('lists only the logged-in org\'s customers', async () => {
    // ACT: A's admin asks for the customer list
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${tokenFor(adminA)}`);

    // ASSERT
    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body); // don't depend on response shape yet
    expect(body).toContain('Alice of A');
    expect(body).not.toContain('Bob of B');
  });

  it('cannot fetch another org\'s customer by id', async () => {
    const res = await request(app)
      .get(`/api/customers/${customerB._id}`)
      .set('Authorization', `Bearer ${tokenFor(adminA)}`);

    expect(res.status).toBe(404); // scoped query finds nothing, so "not found"
    expect(JSON.stringify(res.body)).not.toContain('Bob of B');
  });
});