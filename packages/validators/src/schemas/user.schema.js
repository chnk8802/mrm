import { z } from 'zod';
import { ROLES } from '../constants/user.constant.js';
import { addressSchema } from '../common.js';

export const userSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters'),
    email: z.string()
        .email('Invalid email address')
        .max(100, 'Email cannot exceed 100 characters'),
    phone: z.string()
        .min(10, 'Phone number must be at least 10 digits')
        .max(20, 'Phone number cannot exceed 20 characters'),
    address: addressSchema.optional(),
    password: z.string()
        .min(6, 'Password must be at least 6 characters'),
    role: z.enum(ROLES),
    avatar: z.string().optional(),
}).strict();

export const userUpdateSchema = userSchema.omit({ password: true, email: true}).partial().extend({
    isActive: z.boolean().optional()
});

export const userQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['name', 'email', 'phone', 'role', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    role: z.enum(ROLES).optional(),
    isActive: z.coerce.boolean().optional()
});

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters')
}).strict();