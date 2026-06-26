import { z } from 'zod';

export const objectIdSchema = z.string().refine(
    (val) => /^[0-9a-fA-F]{24}$/.test(val),
    'Invalid ID'
);

export const addressSchema = z.object({
    street: z.string().trim().max(200).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(20).optional(),
    country: z.string().trim().max(100).optional(),
}).strict();