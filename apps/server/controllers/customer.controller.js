import { isValidObjectId } from 'mongoose';
import Customer from '../models/customer.model.js';
import Repair from '../models/repair.model.js'
import { createError } from '../utils/errorHandler.js';
import {
    customerSchema,
    customerUpdateSchema,
    customerBulkUpdateSchema,
    customerBulkDeleteSchema,
    customerQuerySchema
} from '@repo/validators';

import { flattenObject } from '../utils/flattenObject.js';

/**
 * @desc    Create a new customer
 * @route   POST /api/customers
 * @access  Private (Admin/Staff)
 */
export const createCustomer = async (req, res, next) => {
    try {
        const validatedData = customerSchema.parse(req.body);

        const customer = await Customer.create(validatedData);

        res.status(201).json({
            success: true,
            data: customer,
            message: 'Customer created successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all customers with pagination, sorting, and filtering
 * @route   GET /api/customers
 * @access  Private (Admin/Staff)
 */
export const getCustomers = async (req, res, next) => {
    try {
        const { page, limit, sortBy, sortOrder, search, customerType, isActive } = customerQuerySchema.parse(req.query);

        const query = { isDeleted: false };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (customerType) query.customerType = customerType;
        if (isActive !== undefined) query.isActive = isActive;

        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [customers, total] = await Promise.all([
            Customer.find(query).sort(sortOptions).skip(skip).limit(limit),
            Customer.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: customers,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single customer by ID
 * @route   GET /api/customers/:id
 * @access  Private (Admin/Staff)
 */
export const getCustomerById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError('400', 'Invalid ID')

        const customer = await Customer.findOne({ _id: id, isDeleted: false });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        res.json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a customer
 * @route   PATCH /api/customers/:id
 * @access  Private (Admin/Staff)
 */
export const updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError('400', 'Invalid ID')

        const validatedData = customerUpdateSchema.parse(req.body);

        const customer = await Customer.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: flattenObject(validatedData) },
            { new: true, runValidators: true }
        );

        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        res.json({ success: true, data: customer, message: 'Customer updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Soft delete a customer
 * @route   DELETE /api/customers/:id
 * @access  Private (Admin only)
 */
export const deleteCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError('400', 'Invalid ID')

        const hasRepairs = await Repair.exists({ technician: id, isDeleted: false });
        if (hasRepairs) throw createError(400, 'User has repair orders assigned and cannot be deleted');

        const customer = await Customer.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );

        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Restore a soft deleted customer
 * @route   PATCH /api/customers/:id/restore
 * @access  Private (Admin only)
 */
export const restoreCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError('400', 'Invalid ID')

        const customer = await Customer.findById(id).select('+isDeleted');
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        if (!customer.isDeleted) throw createError(400, 'Customer is not deleted');

        customer.isDeleted = false;
        await customer.save();

        res.json({ success: true, message: 'Customer restored successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Permanently delete a customer
 * @route   DELETE /api/customers/:id/permanent
 * @access  Private (Superadmin only)
 */
export const permanentlyDeleteCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError('400', 'Invalid ID')

        const customer = await Customer.findOne({ _id: id, isDeleted: true }).select('+isDeleted');
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found or not soft deleted' });

        await Customer.findByIdAndDelete(id);

        res.json({ success: true, message: 'Customer permanently deleted' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bulk update customers
 * @route   PATCH /api/customers/bulk
 * @access  Private (Admin only)
 */
export const bulkUpdateCustomers = async (req, res, next) => {
    try {
        const { ids, data } = customerBulkUpdateSchema.parse(req.body);

        const result = await Customer.updateMany(
            { _id: { $in: ids }, isDeleted: false },
            { $set: flattenObject(data) }
        );

        if (result.modifiedCount === 0) throw createError(400, 'No customers were updated. They may not exist or are deleted.');

        res.json({
            success: true,
            message: `${result.modifiedCount} customers updated successfully`,
            modifiedCount: result.modifiedCount,
            skipped: ids.length - result.modifiedCount
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bulk soft delete customers
 * @route   DELETE /api/customers/bulk
 * @access  Private (Admin only)
 */
export const bulkDeleteCustomers = async (req, res, next) => {
    try {
        const { ids } = customerBulkDeleteSchema.parse(req.body);

        const hasRepairOrders = await Repair.exists({
            customer: { $in: ids },
            isDeleted: false
        });
        if (hasRepairOrders) throw createError(400, 'One or more customers have active repair orders and cannot be deleted');

        const result = await Customer.updateMany(
            { _id: { $in: ids }, isDeleted: false },
            { isDeleted: true }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} customers deleted successfully`,
            deletedCount: result.modifiedCount
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get customer statistics
 * @route   GET /api/customers/stats
 * @access  Private (Admin only)
 */
export const getCustomerStats = async (req, res, next) => {
    try {
        const stats = await Customer.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ['$isActive', 1, 0] } },
                    inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
                    business: { $sum: { $cond: [{ $eq: ['$customerType', 'business'] }, 1, 0] } },
                    individual: { $sum: { $cond: [{ $eq: ['$customerType', 'individual'] }, 1, 0] } },
                }
            },
            { $project: { _id: 0 } }
        ]);

        res.json({ success: true, data: stats[0] || {} });
    } catch (error) {
        next(error);
    }
};