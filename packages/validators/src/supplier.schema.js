import { z } from 'zod';

export const supplierSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name cannot exceed 100 characters'),
    contactPerson: z.string()
        .max(100, 'Contact person cannot exceed 100 characters')
        .optional(),
    phone: z.string()
        .max(20, 'Phone cannot exceed 20 characters')
        .optional(),
    email: z.string()
        .email('Invalid email')
        .max(100, 'Email cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),
    address: z.string()
        .max(500, 'Address cannot exceed 500 characters')
        .optional(),
    notes: z.string()
        .max(1000, 'Notes cannot exceed 1000 characters')
        .optional(),
    isActive: z.boolean().default(true)
});

export const supplierUpdateSchema = supplierSchema.partial();

export const supplierIdSchema = z.string().refine((val) => {
    return /^[0-9a-fA-F]{24}$/.test(val);
}, 'Invalid supplier ID');

export const supplierQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional()
});