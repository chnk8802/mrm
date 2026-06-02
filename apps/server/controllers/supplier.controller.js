import { isValidObjectId } from 'mongoose';
import Supplier from '../models/supplier.model.js';
import SparePartUsage from '../models/sparePartUsage.model.js';
import { createError } from '../utils/errorHandler.js';
import {
    supplierSchema,
    supplierUpdateSchema,
    supplierBulkUpdateSchema,
    supplierBulkDeleteSchema,
    supplierQuerySchema
} from '@repo/validators';
import { flattenObject } from '../utils/flattenObject.js';

/**
 * @desc    Create a new supplier
 * @route   POST /api/suppliers
 * @access  Private (Admin/Manager)
 */
export const createSupplier = async (req, res, next) => {
    try {
        const validatedData = supplierSchema.parse(req.body);
        const supplier = await Supplier.create(validatedData);
        res.status(201).json({ success: true, data: supplier, message: 'Supplier created successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all suppliers with pagination, sorting, and filtering
 * @route   GET /api/suppliers
 * @access  Private (Admin/Manager)
 */
export const getSuppliers = async (req, res, next) => {
    try {
        const { page, limit, sortBy, sortOrder, search, isActive } = supplierQuerySchema.parse(req.query);

        const query = { isDeleted: false };

        if (search) {
            query.$or = [
                { name:  { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (isActive !== undefined) query.isActive = isActive;

        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [suppliers, total] = await Promise.all([
            Supplier.find(query).sort(sortOptions).skip(skip).limit(limit),
            Supplier.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: suppliers,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single supplier by ID
 * @route   GET /api/suppliers/:id
 * @access  Private (Admin/Manager)
 */
export const getSupplierById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

        res.json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a supplier
 * @route   PATCH /api/suppliers/:id
 * @access  Private (Admin/Manager)
 */
export const updateSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const validatedData = supplierUpdateSchema.parse(req.body);

        const supplier = await Supplier.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: flattenObject(validatedData) },
            { new: true, runValidators: true }
        );
        

        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

        res.json({ success: true, data: supplier, message: 'Supplier updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Soft delete a supplier
 * @route   DELETE /api/suppliers/:id
 * @access  Private (Admin only)
 */
export const deleteSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const hasSparePartUsage = await SparePartUsage.exists({ supplier: id, isDeleted: false });
        if (hasSparePartUsage) throw createError(400, 'Supplier has spare part records and cannot be deleted');

        const supplier = await Supplier.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );

        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

        res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Restore a soft deleted supplier
 * @route   PATCH /api/suppliers/:id/restore
 * @access  Private (Admin only)
 */
export const restoreSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const supplier = await Supplier.findById(id).select('+isDeleted');
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

        if (!supplier.isDeleted) throw createError(400, 'Supplier is not deleted');

        supplier.isDeleted = false;
        await supplier.save();

        res.json({ success: true, message: 'Supplier restored successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Permanently delete a supplier
 * @route   DELETE /api/suppliers/:id/permanent
 * @access  Private (Superadmin only)
 */
export const permanentlyDeleteSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const supplier = await Supplier.findOne({ _id: id, isDeleted: true }).select('+isDeleted');
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found or not soft deleted' });

        await Supplier.findByIdAndDelete(id);

        res.json({ success: true, message: 'Supplier permanently deleted' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bulk update suppliers
 * @route   PATCH /api/suppliers/bulk
 * @access  Private (Admin only)
 */
export const bulkUpdateSuppliers = async (req, res, next) => {
    try {
        const { ids, data } = supplierBulkUpdateSchema.parse(req.body);

        const result = await Supplier.updateMany(
            { _id: { $in: ids }, isDeleted: false },
            { $set: flattenObject(data) }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} of ${ids.length} suppliers updated successfully`,
            modifiedCount: result.modifiedCount,
            skipped: ids.length - result.modifiedCount
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bulk soft delete suppliers
 * @route   DELETE /api/suppliers/bulk
 * @access  Private (Admin only)
 */
export const bulkDeleteSuppliers = async (req, res, next) => {
    try {
        const { ids } = supplierBulkDeleteSchema.parse(req.body);

        const hasSparePartUsage = await SparePartUsage.exists({
            supplier: { $in: ids },
            isDeleted: false
        });
        if (hasSparePartUsage) throw createError(400, 'One or more suppliers have spare part records and cannot be deleted');

        const result = await Supplier.updateMany(
            { _id: { $in: ids }, isDeleted: false },
            { isDeleted: true }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} suppliers deleted successfully`,
            deletedCount: result.modifiedCount
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get supplier statistics
 * @route   GET /api/suppliers/stats
 * @access  Private (Admin only)
 */
export const getSupplierStats = async (req, res, next) => {
    try {
        const stats = await Supplier.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    total:    { $sum: 1 },
                    active:   { $sum: { $cond: ['$isActive', 1, 0] } },
                    inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
                }
            },
            { $project: { _id: 0 } }
        ]);

        res.json({ success: true, data: stats[0] || {} });
    } catch (error) {
        next(error);
    }
};