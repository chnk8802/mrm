import { z } from 'zod';
import { objectIdSchema } from '../common.js';

export const sparePartUsageSchema = z.object({
    repair:      objectIdSchema,
    sparePart:   z.string().min(3, 'Spare part name must be at least 3 characters').max(100),
    supplier:    objectIdSchema.optional(),
    quantity:    z.number().int().min(1),
    unitCost:    z.number().min(0),
    notes:       z.string().max(500).optional(),
}).strict();

export const sparePartUsageBulkCreateSchema = z.object({
    repair: objectIdSchema,
    parts: z.array(sparePartUsageSchema.omit({ repair: true })).min(1, 'At least one part is required')
}).strict();

export const sparePartUsageUpdateSchema = sparePartUsageSchema.omit({ repair: true }).partial();

export const sparePartUsageBulkUpdateSchema = z.object({
    updates: z.array(z.object({
        id: objectIdSchema,
        data: sparePartUsageUpdateSchema
    })).min(1, 'At least one update is required')
}).strict();

export const sparePartUsageQuerySchema = z.object({
    page:      z.coerce.number().int().positive().default(1),
    limit:     z.coerce.number().int().positive().max(100).default(10),
    sortBy:    z.enum(['sparePart', 'quantity', 'unitCost', 'installedAt', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    repair:    objectIdSchema.optional(),
    supplier:  objectIdSchema.optional(),
});

