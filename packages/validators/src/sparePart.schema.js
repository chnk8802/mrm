import { z } from 'zod';

const categorySchema = z.enum([
    'screen',
    'battery',
    'camera',
    'charging-port',
    'speaker',
    'microphone',
    'motherboard',
    'sim-tray',
    'back-panel',
    'other'
]);

export const sparePartSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name cannot exceed 100 characters'),
    category: categorySchema,
    description: z.string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    isActive: z.boolean().default(true)
});

export const sparePartUpdateSchema = sparePartSchema.partial();

export const sparePartIdSchema = z.string().refine((val) => {
    return /^[0-9a-fA-F]{24}$/.test(val);
}, 'Invalid spare part ID');

export const sparePartQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['name', 'category', 'partNumber', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    category: categorySchema.optional(),
    isActive: z.coerce.boolean().optional(),
    isInUse: z.coerce.boolean().optional()
});

// Spare Part Usage schemas
export const sparePartUsageSchema = z.object({
    repairId: z.string()
        .min(1, 'Repair ID is required')
        .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), 'Invalid repair ID'),
    sparePartId: z.string()
        .min(1, 'Spare part ID is required')
        .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), 'Invalid spare part ID'),
    quantity: z.number().int().positive('Quantity must be at least 1').default(1),
    unitCost: z.number().min(0, 'Unit cost cannot be negative').default(0),
    supplierId: z.any().optional(),
    warrantyStartDate: z.string().optional(),
    warrantyEndDate: z.string().optional(),
    notes: z.string().max(500).optional()
});

export const sparePartUsageUpdateSchema = sparePartUsageSchema.partial().extend({
    quantity: z.number().int().positive('Quantity must be at least 1')
});