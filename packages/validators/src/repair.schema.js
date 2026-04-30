import { z } from 'zod';

const componentSchema = z.enum([
    'SIM',
    'SIM Tray',
    'Battery',
    'Back Panel',
    'Screen',
    'Charging Port',
    'Speaker',
    'Microphone',
    'Camera',
    'Fingerprint Sensor',
    'Face ID',
    'WiFi Antenna',
    'Bluetooth Antenna',
    'Motherboard',
    'Other'
]);

export const repairSchema = z.object({
    customer: z.string()
        .min(1, 'Customer is required')
        .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), 'Invalid customer ID'),
    technician: z.string()
        .optional()
        .refine((val) => !val || /^[0-9a-fA-F]{24}$/.test(val), 'Invalid technician ID'),
    model: z.string()
        .min(1, 'Model is required')
        .max(100, 'Model cannot exceed 100 characters'),
    imei: z.string()
        .min(15, 'IMEI must be at least 15 digits')
        .max(20, 'IMEI cannot exceed 20 characters'),
    problem: z.string()
        .min(5, 'Problem description must be at least 5 characters')
        .max(500, 'Problem cannot exceed 500 characters'),
    repairPrice: z.number()
        .min(0, 'Repair price cannot be negative'),
    costPrice: z.number()
        .min(0, 'Cost price cannot be negative')
        .optional()
        .default(0),
    components: z.array(componentSchema).optional(),
    otherComponent: z.string()
        .max(100, 'Other component cannot exceed 100 characters')
        .optional(),
    status: z.enum(['received', 'in-progress', 'ready', 'not-repairable', 'completed', 'cancelled'])
        .optional()
        .default('received'),
    priority: z.enum(['low', 'medium', 'high'])
        .optional()
        .default('medium'),
    notes: z.array(z.string()).optional()
});

export const repairUpdateSchema = repairSchema.partial();

export const repairIdSchema = z.string().refine((val) => {
    return /^[0-9a-fA-F]{24}$/.test(val);
}, 'Invalid repair ID');

export const repairQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['repairId', 'model', 'status', 'repairPrice', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    status: z.enum(['received', 'in-progress', 'ready', 'not-repairable', 'completed', 'cancelled'])
        .optional()
        .default('received'),
    customer: z.string().optional(),
    technician: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional()
});

export const assignTechnicianSchema = z.object({
    technicianId: z.string()
        .min(1, 'Technician ID is required')
        .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), 'Invalid technician ID')
});

export const completeRepairSchema = z.object({
    repairPrice: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    notes: z.string().optional()
});