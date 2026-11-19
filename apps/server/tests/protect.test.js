import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import config from '../config/env.js';
import User from '../models/user.model.js';
import Organization from '../models/organization.model.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { createOrg, createUser, tokenFor } from './helpers/factories.js';

// Any protected route works; we're testing the gate, not the customers route.
const getCustomers = (token) => {
  const req = request(app).get('/api/customers');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

describe('protect middleware', () => {
  let org, admin;

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    await clearTestDb();
    org = await createOrg('Shop A');
    admin = await createUser(org, 'admin');
  });

  it('lets a valid user through (baseline)', async () => {
    const res = await getCustomers(tokenFor(admin));
    expect(res.status).toBe(200);
  });

  it('accepts the token from a cookie too', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Cookie', `token=${tokenFor(admin)}`);
    expect(res.status).toBe(200);
  });

  it('rejects a request with no token', async () => {
    const res = await getCustomers(null);
    expect(res.status).toBe(401);
  });

  it('rejects a garbage token', async () => {
    const res = await getCustomers('not.a.real.token');
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ id: admin._id }, 'some-other-secret');
    const res = await getCustomers(forged);
    expect(res.status).toBe(401);
  });

  it('rejects an inactive user', async () => {
    await User.updateOne({ _id: admin._id }, { isActive: false });
    const res = await getCustomers(tokenFor(admin));
    expect(res.status).toBe(401);
  });

  it('rejects a deleted user', async () => {
    await User.updateOne({ _id: admin._id }, { isDeleted: true });
    const res = await getCustomers(tokenFor(admin));
    expect(res.status).toBe(401);
  });

  it('rejects users of an inactive org with 403', async () => {
    await Organization.updateOne({ _id: org._id }, { isActive: false });
    const res = await getCustomers(tokenFor(admin));
    expect(res.status).toBe(403);
  });

  it('rejects users of a deleted org with 403', async () => {
    await Organization.updateOne({ _id: org._id }, { isDeleted: true });
    const res = await getCustomers(tokenFor(admin));
    expect(res.status).toBe(403);
  });

  it('rejects a token issued before the password was changed', async () => {
    // Token "issued" 100 seconds ago (iat = issued-at, in seconds)
    const oldToken = jwt.sign(
      { id: admin._id, iat: Math.floor(Date.now() / 1000) - 100 },
      config.JWT_SECRET
    );
    await User.updateOne({ _id: admin._id }, { passwordChangedAt: new Date() });

    const res = await getCustomers(oldToken);
    expect(res.status).toBe(401);
  });

  it('blocks everything except profile/password routes while mustChangePassword is set', async () => {
    await User.updateOne({ _id: admin._id }, { mustChangePassword: true });
    const token = tokenFor(admin);

    const blocked = await getCustomers(token);
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');

    const allowed = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(allowed.status).not.toBe(403); // it passed the gate; what it returns is another test's job
  });

  it('does not apply the org check to superadmin (who has no org)', async () => {
    const superadmin = await createUser(null, 'superadmin');
    const res = await getCustomers(tokenFor(superadmin));
    expect(res.status).toBe(200);
  });
});