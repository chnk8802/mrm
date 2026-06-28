import { z } from 'zod';
import { addressSchema } from '../common.js';

export const createOrganizationSchema = z.object({
    name: z.string().min(1, 'Organization name is required').max(100),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(20).optional(),
    admin: z.object({
        name: z.string().min(1, 'Admin name is required').max(100),
        email: z.string().email('Invalid email'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        phone: z.string().min(1, 'Phone is required').max(20),
        address: addressSchema.optional()
    })
}).strict();

export const organizationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional()
});