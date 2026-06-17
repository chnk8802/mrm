import { z } from 'zod';
import { objectIdSchema } from '../common.js';

export const reportQuerySchema = z.object({
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    technician: objectIdSchema.optional(),
});