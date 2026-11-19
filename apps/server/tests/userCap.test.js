import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { createOrg, createUser, tokenFor } from './helpers/factories.js';

let n = 0;
const newUserBody = (role = 'staff') => ({
    name: 'New Person',
    email: `new${++n}@test.com`, // unique every time
    password: 'Password123!',
    role,
    phone: '9876543210',
});

const postUser = (actor, body) =>
    request(app).post('/api/users').set('Authorization', `Bearer ${tokenFor(actor)}`).send(body);

describe('POST /api/users', () => {
    beforeAll(connectTestDb);
    afterAll(disconnectTestDb);
    beforeEach(clearTestDb);

    it('creates a staff user, hides the password, forces a password change (baseline)', async () => {
        const org = await createOrg('Shop A', { userCap: 5 });
        const admin = await createUser(org, 'admin');

        const res = await postUser(admin, newUserBody('staff'));

        expect(res.status).toBe(201);
        expect(res.body.data.password).toBeUndefined();
        expect(res.body.data.mustChangePassword).toBe(true);
        expect(String(res.body.data.orgId)).toBe(String(org._id)); // tagged with the admin's org
    });

    describe('user cap', () => {
        it('blocks creation when the user count is exactly at the cap', async () => {
            const org = await createOrg('Shop A', { userCap: 2 });
            const admin = await createUser(org, 'admin');
            await createUser(org, 'staff'); // admin + staff = 2 = the cap

            const res = await postUser(admin, newUserBody());

            expect(res.status).toBe(403);
            expect(res.body.message).toContain('User limit reached');
        });

        it('allows creation when one slot is still free', async () => {
            const org = await createOrg('Shop A', { userCap: 3 });
            const admin = await createUser(org, 'admin');
            await createUser(org, 'staff'); // 2 of 3 used

            const res = await postUser(admin, newUserBody());

            expect(res.status).toBe(201);
        });

        it('does not count soft-deleted users', async () => {
            const org = await createOrg('Shop A', { userCap: 2 });
            const admin = await createUser(org, 'admin');
            await createUser(org, 'staff', { isDeleted: true }); // doesn't take a slot

            const res = await postUser(admin, newUserBody());

            expect(res.status).toBe(201);
        });

        it('ignores the cap when capsOverride is on', async () => {
            const org = await createOrg('Shop A', { userCap: 1, capsOverride: true });
            const admin = await createUser(org, 'admin'); // already at the cap

            const res = await postUser(admin, newUserBody());

            expect(res.status).toBe(201);
        });

        it('counts per org: a full org does not block another org', async () => {
            const orgA = await createOrg('Shop A', { userCap: 5 });
            const orgB = await createOrg('Shop B', { userCap: 1 });
            const adminA = await createUser(orgA, 'admin');
            await createUser(orgB, 'admin'); // B is full

            const res = await postUser(adminA, newUserBody());

            expect(res.status).toBe(201);
        });
    });

    describe('who can create what', () => {
        it('lets an admin create a manager but not another admin', async () => {
            const org = await createOrg('Shop A', { userCap: 10 });
            const admin = await createUser(org, 'admin');

            const okRes = await postUser(admin, newUserBody('manager'));
            const badRes = await postUser(admin, newUserBody('admin'));

            expect(okRes.status).toBe(201);
            expect(badRes.status).toBe(403);
        });

        it('does not let a manager create users', async () => {
            const org = await createOrg('Shop A', { userCap: 10 });
            const manager = await createUser(org, 'manager');

            const res = await postUser(manager, newUserBody('staff'));

            expect(res.status).toBe(403);
        });
    });

    it('rejects an email that already exists in ANY org', async () => {
        const orgA = await createOrg('Shop A', { userCap: 10 });
        const orgB = await createOrg('Shop B', { userCap: 10 });
        const adminA = await createUser(orgA, 'admin');
        await createUser(orgB, 'staff', { email: 'taken@test.com' });

        const res = await postUser(adminA, { ...newUserBody(), email: 'taken@test.com' });

        expect(res.status).toBe(400);
    });

    it('still counts deactivated users (they must be deleted to free a slot)', async () => {
        const org = await createOrg('Shop A', { userCap: 2 });
        const admin = await createUser(org, 'admin');
        await createUser(org, 'staff', { isActive: false }); // deactivated, not deleted

        const res = await postUser(admin, newUserBody());

        expect(res.status).toBe(403);
    });
});