import { z } from 'zod';
import { objectIdSchema } from '../common.js';
import { PAYMENT_METHODS, PAYMENT_TYPES } from '../constants/payment.constant.js';

const lineItemSchema = z.object({
    repair: objectIdSchema.optional(),
    sparePartUsage: objectIdSchema.optional(),
    amountPaid: z.number().min(0.01, 'Amount must be greater than 0'),
}).strict();

const basePaymentSchema = z.object({
    type: z.enum(PAYMENT_TYPES, { required_error: 'Payment type is required' }),
    customer: objectIdSchema.optional(),
    supplier: objectIdSchema.optional(),
    paymentMethod: z.enum(PAYMENT_METHODS, { required_error: 'Payment method is required' }),
    paidAt: z.coerce.date().optional(),
    notes: z.string().max(500).optional(),
    lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
    isFullAndFinal: z.boolean().optional(),
}).strict();

export const paymentFNFSchema = basePaymentSchema.pick({
    type: true,
    customer: true,
    supplier: true,
    paymentMethod: true,
    paidAt: true,
    notes: true
}).superRefine((data, ctx) => {
    if (data.type === 'receivable' && !data.customer) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customer'], message: 'Customer is required for receivable payments' });
    }
    if (data.type === 'payable' && !data.supplier) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['supplier'], message: 'Supplier is required for payable payments' });
    }
});

export const paymentSchema = basePaymentSchema.superRefine((data, ctx) => {
    // customer/supplier validation based on type
    if (data.type === 'receivable' && !data.customer) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customer'], message: 'Customer is required for receivable payments' });
    }
    if (data.type === 'payable' && !data.supplier) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['supplier'], message: 'Supplier is required for payable payments' });
    }

    // line items validation based on type
    data.lineItems.forEach((item, index) => {
        if (data.type === 'receivable' && !item.repair) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineItems', index, 'repair'], message: 'Repair is required for receivable line items' });
        }
        if (data.type === 'payable' && !item.sparePartUsage) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineItems', index, 'sparePartUsage'], message: 'Spare part usage is required for payable line items' });
        }
    });
});

export const paymentQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['paidAt', 'totalAmount', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    type: z.enum(PAYMENT_TYPES).optional(),
    customer: objectIdSchema.optional(),
    supplier: objectIdSchema.optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    isFullAndFinal: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
});