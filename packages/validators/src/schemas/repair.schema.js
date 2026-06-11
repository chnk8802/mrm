import { z } from 'zod';
import { PAYMENT_STATUS, STATUS_OPTIONS } from '../constant.index.js';
import { objectIdSchema } from '../common.js';

export const repairSchema = z.object({
    customer:      objectIdSchema,
    technician:    objectIdSchema.optional(),
    deviceModel:   z.string().min(1, 'Device model is required').max(100),
    imei:          z.string().max(20).optional(),
    problem:       z.string().min(3, 'Problem must be at least 3 characters').max(500),
    accessories:   z.string().max(200).optional(),
    serviceCharge: z.number().min(0, 'Service charge cannot be negative'),
    discount: z.number().min(0).optional(),
    dueDate:       z.coerce.date().optional(),
    notes:         z.string().min(1).max(500).optional(),
}).strict();

export const repairUpdateSchema = repairSchema.partial();

export const repairQuerySchema = z.object({
    page:      z.coerce.number().int().positive().default(1),
    limit:     z.coerce.number().int().positive().max(100).default(10),
    sortBy:    z.enum(['repairId', 'deviceModel', 'status', 'serviceCharge', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search:    z.string().optional(),
    status:    z.enum(STATUS_OPTIONS).optional(),
    statuses: z.array(z.enum(STATUS_OPTIONS)).optional(),
    customer:  z.string().optional(),
    technician:z.string().optional(),
    paymentStatus: z.enum(PAYMENT_STATUS).optional(),
    isPickedUp:z.coerce.boolean().optional(),
});

export const statusUpdateSchema = z.object({
    status: z.enum(STATUS_OPTIONS, { required_error: 'Status is required' })
}).strict();

export const assignTechnicianSchema = z.object({
    technicianId: objectIdSchema
}).strict();

export const pickupSchema = z.object({
    pickedUpAt: z.coerce.date().optional()
}).strict();