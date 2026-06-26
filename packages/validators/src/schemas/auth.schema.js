import { z } from 'zod';
import { addressSchema } from '../common.js';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10).max(20),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    address: addressSchema.optional(),
}).strict();

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
}).strict();

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(10).max(20).optional(),
    avatar: z.string().optional(),
    address: addressSchema.optional(),
    password: z.string().min(6).optional(),
}).strict();