import { z } from 'zod';

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
    address: z.string()
        .min(5, 'Address must be at least 5 characters')
        .max(200, 'Address cannot exceed 200 characters'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters'),
    role: z.enum(['staff', 'technician', 'admin'])
        .default('admin'),
    avatar: z.string().optional()
});

export const userUpdateSchema = userSchema.omit({ password: true }).partial();

export const userIdSchema = z.string().refine((val) => {
    return /^[0-9a-fA-F]{24}$/.test(val);
}, 'Invalid user ID');

export const userBulkUpdateSchema = z.object({
    ids: z.array(userIdSchema).min(1, 'At least one user ID is required'),
    data: userUpdateSchema
});

export const userQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['name', 'email', 'phone', 'role', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    role: z.enum(['staff', 'technician', 'admin']).optional(),
    isActive: z.coerce.boolean().optional()
});

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters')
});