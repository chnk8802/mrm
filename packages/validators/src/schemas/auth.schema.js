import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10).max(20),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    address: z.object({
        street: z.string().max(200, 'Street address cannot exceed 200 characters').optional(),
        city: z.string().max(100, 'City cannot exceed 100 characters').optional(),
        state: z.string().max(100, 'State cannot exceed 100 characters').optional(),
        postalCode: z.string().max(20, 'Postal code cannot exceed 20 characters').optional(),
        country: z.string().max(100, 'Country cannot exceed 100 characters').optional()
    }).optional(),
}).strict();

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
}).strict();

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(10).max(20).optional(),
    avatar: z.string().optional(),
    address: z.object({
        street: z.string().max(200).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        postalCode: z.string().max(20).optional(),
        country: z.string().max(100).optional()
    }).optional(),
    password: z.string().min(6).optional(),
}).strict();