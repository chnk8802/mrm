import { z } from 'zod';
import { addressSchema, objectIdSchema } from '../common.js';

export const supplierSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name cannot exceed 100 characters'),
    phone: z.string()
        .max(20, 'Phone cannot exceed 20 characters')
        .optional(),
    email: z.string()
        .email('Invalid email')
        .max(100, 'Email cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),
    address: addressSchema.optional(),
    notes: z.string()
        .max(1000, 'Notes cannot exceed 1000 characters')
        .optional(),
}).strict();

export const supplierUpdateSchema = supplierSchema.partial().extend({
    isActive: z.boolean().optional()
});

export const supplierBulkUpdateSchema = z.object({
    ids: z.array(objectIdSchema).min(1, 'At least one supplier ID is required'),
    data: supplierUpdateSchema
}).strict();

export const supplierBulkDeleteSchema = z.object({
    ids: z.array(objectIdSchema).min(1, 'At least one supplier ID is required')
}).strict();

export const supplierQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional()
});