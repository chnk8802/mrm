import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

export const objectIdSchema = z.string().refine(isValidObjectId, 'Invalid ID');