import { z } from 'zod';

export const customerSchema = z.object({
    customerType: z.enum(['business', 'individual'], {
        required_error: 'Customer type is required',
        invalid_type_error: 'Customer type must be either business or individual'
    }),
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters'),
    phone: z.string()
        .max(20, 'Phone number cannot exceed 20 characters')
        .optional()
        .or(z.literal('')),
    email: z.string()
        .email('Invalid email address')
        .max(100, 'Email cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),
    address: z.object({
        street: z.string().max(200, 'Street address cannot exceed 200 characters').optional(),
        city: z.string().max(100, 'City cannot exceed 100 characters').optional(),
        state: z.string().max(100, 'State cannot exceed 100 characters').optional(),
        postalCode: z.string().max(20, 'Postal code cannot exceed 20 characters').optional(),
        country: z.string().max(100, 'Country cannot exceed 100 characters').optional()
    }).optional(),
    notes: z.string()
        .max(1000, 'Notes cannot exceed 1000 characters')
        .optional()
        .or(z.literal('')),
    isActive: z.boolean().optional()
});

export const customerUpdateSchema = customerSchema.partial();

export const customerIdSchema = z.string().refine((val) => {
    return /^[0-9a-fA-F]{24}$/.test(val);
}, 'Invalid customer ID');

export const customerBulkUpdateSchema = z.object({
    ids: z.array(customerIdSchema).min(1, 'At least one customer ID is required'),
    data: customerUpdateSchema
});

export const customerQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['name', 'customerType', 'phone', 'email', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    customerType: z.enum(['business', 'individual']).optional(),
    isActive: z.coerce.boolean().optional()
});