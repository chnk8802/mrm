import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import config from '../../config/env.js';
import Organization from '../../models/organization.model.js';
import User from '../../models/user.model.js';
import Customer from '../../models/customer.model.js';
import { CUSTOMER_TYPE } from '@repo/validators';
import Repair from '../../models/repair.model.js';
import Plan from '../../models/plan.model.js';
import bcrypt from 'bcryptjs';

let counter = 0; // makes emails unique (User has a unique email index)

// Real plan now, instead of a fake id. Override caps per test.
export const createOrg = async (name = 'Test Org', { recordCap = 1000, userCap = 50, capsOverride = false } = {}) => {
  const plan = await Plan.create({
    name: 'Test Plan',
    slug: `test-plan-${++counter}`, // slug is unique, so each plan needs its own
    recordCap,
    userCap,
  });
  return Organization.create({
    name,
    subscription: { planId: plan._id, capsOverride },
  });
};

// orgId is passed explicitly because there's no request context outside a request,
// so your plugin can't fill it in for us.
export const createUser = (org, role = 'admin', overrides = {}) =>
  User.create({
    name: `Test ${role}`,
    email: `${role}${++counter}@test.com`,
    password: 'not-a-real-hash',
    role,
    phone: '1234567890',
    orgId: org?._id,
    ...overrides, // later keys win, so overrides replace the defaults above
  });

// Skip the login route: sign a token ourselves, exactly like login would.
export const tokenFor = (user) =>
  jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '1h' });

// Works whether CUSTOMER_TYPE is an array or an object
const firstType = Array.isArray(CUSTOMER_TYPE)
  ? CUSTOMER_TYPE[0]
  : Object.values(CUSTOMER_TYPE)[0];

export const createCustomer = (org, name) =>
  Customer.create({ orgId: org._id, name, customerType: firstType });

// Sensible defaults so each test only specifies what it cares about
export const createRepair = (org, customer, overrides = {}) =>
  Repair.create({
    orgId: org._id,
    customer: customer._id,
    deviceModel: 'Phone X',
    problem: 'Cracked screen',
    serviceCharge: 500,
    ...overrides,
  });

export const hashPassword = (plain) => bcrypt.hash(plain, 4);