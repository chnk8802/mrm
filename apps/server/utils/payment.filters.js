import mongoose from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { createError } from './errorHandler.js';

export const ELIGIBLE_REPAIR_STATUSES = ['ready', 'completed'];

export const getOutstandingRepairFilter = (customerId) => {
    if (!isValidObjectId(customerId)) throw createError(400, 'Invalid customer ID');
    return {
        customer: new mongoose.Types.ObjectId(customerId),
        paymentStatus: { $in: ['unpaid', 'partial'] },
        status: { $in: ELIGIBLE_REPAIR_STATUSES },
        isDeleted: false
    };
};

export const getOutstandingSparePartFilter = (supplierId) => {
    if (!isValidObjectId(supplierId)) throw createError(400, 'Invalid supplier ID');
    return {
        supplier: new mongoose.Types.ObjectId(supplierId),
        paymentStatus: { $in: ['unpaid', 'partial'] },
        isDeleted: false
    };
};