import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Repair from '../models/repair.model.js';
import Customer from '../models/customer.model.js';
import { PAYMENT_METHODS } from '@repo/validators';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { createOrg, createUser, createCustomer, createRepair, tokenFor } from './helpers/factories.js';

const auth = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });

const patch = (user, url, body = {}) =>
  request(app).patch(url).set(auth(user)).send(body);

const firstMethod = Array.isArray(PAYMENT_METHODS)
  ? PAYMENT_METHODS[0]
  : Object.values(PAYMENT_METHODS)[0];

const paymentBody = (customer, repair) => ({
  type: 'receivable',
  customer: String(customer._id),
  paymentMethod: firstMethod,
  lineItems: [{ repair: String(repair._id), amountPaid: 200 }],
});

describe('repair business rules', () => {
  let org, admin, tech, customer;

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    await clearTestDb();
    org = await createOrg('Shop A');
    admin = await createUser(org, 'admin');
    tech = await createUser(org, 'staff');
    customer = await createCustomer(org, 'Alice');
    // createRepair (the factory) skips the controller, so set the balance by hand
    await Customer.updateOne({ _id: customer._id }, { outstandingBalance: 500 });
  });

  // it.each runs the same test once per row. %s fills in the row's values in the title.
  describe('waiving the balance', () => {
    it.each([
      ['received', 'cancelled'],
      ['in-progress', 'cancelled'],
      ['in-progress', 'not-repairable'],
    ])('%s -> %s waives the repair and clears the customer balance', async (from, to) => {
      const repair = await createRepair(org, customer, {
        status: from,
        technician: from === 'in-progress' ? tech._id : undefined,
      });

      const res = await patch(admin, `/api/repairs/${repair._id}/status`, { status: to });
      expect(res.status).toBe(200);

      const updatedRepair = await Repair.findById(repair._id);
      expect(updatedRepair.status).toBe(to);
      expect(updatedRepair.paymentStatus).toBe('waived');

      const updatedCustomer = await Customer.findById(customer._id);
      expect(updatedCustomer.outstandingBalance).toBe(0); // the line that exposes the import bug
    });
  });

  describe('payments', () => {
    it('accepts a payment on a ready repair (baseline: proves the payload is valid)', async () => {
      const repair = await createRepair(org, customer, { status: 'ready' });

      const res = await request(app).post('/api/payments').set(auth(admin)).send(paymentBody(customer, repair));

      expect(res.status).toBe(201);
    });

    it('rejects a payment on a not-repairable repair, and changes nothing', async () => {
      const repair = await createRepair(org, customer, {
        status: 'not-repairable',
        paymentStatus: 'waived',
      });

      const res = await request(app).post('/api/payments').set(auth(admin)).send(paymentBody(customer, repair));

      expect(res.status).toBe(400);
      const after = await Repair.findById(repair._id);
      expect(after.amountPaid).toBe(0);
    });
  });

  describe('pickup', () => {
    it('ready -> completed on pickup', async () => {
      const repair = await createRepair(org, customer, { status: 'ready' });

      const res = await patch(admin, `/api/repairs/${repair._id}/pickup`);
      expect(res.status).toBe(200);

      const after = await Repair.findById(repair._id);
      expect(after.status).toBe('completed');
      expect(after.isPickedUp).toBe(true);
      expect(after.completedAt).toBeDefined();
    });

    it('not-repairable stays not-repairable on pickup', async () => {
      const repair = await createRepair(org, customer, { status: 'not-repairable' });

      const res = await patch(admin, `/api/repairs/${repair._id}/pickup`);
      expect(res.status).toBe(200);

      const after = await Repair.findById(repair._id);
      expect(after.status).toBe('not-repairable');
      expect(after.isPickedUp).toBe(true);
    });

    it('rejects pickup while the repair is still received', async () => {
      const repair = await createRepair(org, customer, { status: 'received' });

      const res = await patch(admin, `/api/repairs/${repair._id}/pickup`);

      expect(res.status).toBe(400);
    });

    it('rejects a second pickup', async () => {
      const repair = await createRepair(org, customer, { status: 'not-repairable' });
      await patch(admin, `/api/repairs/${repair._id}/pickup`);

      const res = await patch(admin, `/api/repairs/${repair._id}/pickup`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already picked up');
    });
  });
});