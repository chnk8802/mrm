import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { createOrg, createUser, hashPassword } from './helpers/factories.js';

const PASSWORD = 'Password123!';
const WRONG = 'WrongPass123!';

const login = (email, password) =>
  request(app).post('/api/auth/login').send({ email, password });

// Create a user who can really log in
async function makeLoginUser(email) {
  const org = await createOrg(`Org for ${email}`);
  return createUser(org, 'admin', { email, password: await hashPassword(PASSWORD) });
}

describe('POST /api/auth/login', () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(clearTestDb);

  it('logs in with correct credentials and sets the cookie (baseline)', async () => {
    await makeLoginUser('baseline@test.com');

    const res = await login('baseline@test.com', PASSWORD);

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].join(';')).toContain('token=');
  });

  it('returns 401 for a wrong password', async () => {
    await makeLoginUser('wrongpw@test.com');

    const res = await login('wrongpw@test.com', WRONG);

    expect(res.status).toBe(401);
  });

  it('blocks the 4th attempt with 429, even with the correct password', async () => {
    await makeLoginUser('locked@test.com');

    for (let i = 0; i < 3; i++) {
      const res = await login('locked@test.com', WRONG);
      expect(res.status).toBe(401); // attempts 1-3 are allowed, and fail normally
    }

    const blocked = await login('locked@test.com', PASSWORD); // right password now
    expect(blocked.status).toBe(429);
  });

  it('does not block a different email from the same IP', async () => {
    await makeLoginUser('victim@test.com');
    await makeLoginUser('innocent@test.com');

    for (let i = 0; i < 4; i++) await login('victim@test.com', WRONG); // lock victim out

    const res = await login('innocent@test.com', PASSWORD);
    expect(res.status).toBe(200);
  });

  it('does not count successful logins toward the limit', async () => {
    await makeLoginUser('frequent@test.com');

    for (let i = 0; i < 5; i++) {
      const res = await login('frequent@test.com', PASSWORD);
      expect(res.status).toBe(200); // 5 successes, and the limit is 3
    }
  });
});