import mongoose from 'mongoose';
import { isValidObjectId } from 'mongoose';

import SparePartUsage from '../models/sparePartUsage.model.js';
import Repair from '../models/repair.model.js';
import Supplier from '../models/supplier.model.js';
import {
    sparePartUsageSchema,
    sparePartUsageBulkCreateSchema,
    sparePartUsageUpdateSchema,
    sparePartUsageBulkUpdateSchema,
    sparePartUsageQuerySchema,
} from '@repo/validators';
import withTransaction from '../utils/common/withTransaction.js';
import { createError } from '../utils/common/errorHandler.js';
import { checkRecordCap } from '../utils/common/checkRecordCap.js';

const populate = (query) => query
    .populate('repair', 'repairId deviceModel status')
    .populate('supplier', 'name phone')
    .populate('installedBy', 'name email');

const verifyRepair = async (repairId) => {
    const repair = await Repair.findOne({ _id: repairId, isDeleted: false });
    if (!repair) throw createError(404, 'Repair not found');
    return repair;
};

const verifySupplier = async (supplierId) => {
    const supplier = await Supplier.findOne({ _id: supplierId, isDeleted: false, isActive: true });
    if (!supplier) throw createError(404, 'Supplier not found');
};

const partOwed = (p) => (p.unitCost ?? 0) * (p.quantity ?? 1);

const assertRepairInProgress = async (repairId, session) => {
    const repair = await Repair.findOne({ _id: repairId, isDeleted: false }).session(session ?? null);
    if (!repair) throw createError(404, 'Repair not found');
    if (repair.status !== 'in-progress') {
        throw createError(400, 'Spare parts can only be changed while the repair is in progress');
    }
};

// Shared by single and bulk update. Must run inside a transaction.
const updatePartInTx = async (id, data, session) => {
    const existing = await SparePartUsage.findOne({ _id: id, isDeleted: false }).session(session);
    if (!existing) throw createError(404, 'Spare part usage not found');

    await assertRepairInProgress(existing.repair, session);

    const oldOwed = partOwed(existing);
    const newOwed = (data.unitCost ?? existing.unitCost ?? 0) * (data.quantity ?? existing.quantity ?? 1);

    const oldSupplier = existing.supplier?.toString() ?? null;
    const newSupplier = data.supplier !== undefined ? (data.supplier?.toString() ?? null) : oldSupplier;

    const costChanged = newOwed !== oldOwed || oldSupplier !== newSupplier;

    if (costChanged && (existing.amountPaid ?? 0) > 0) {
        throw createError(400, 'Cannot change cost, quantity or supplier after payment has been made');
    }

    const updated = await SparePartUsage.findOneAndUpdate(
        { _id: id, isDeleted: false },
        data,
        { new: true, runValidators: true, session },
    );

    if (costChanged) {
        if (oldSupplier) {
            await Supplier.findByIdAndUpdate(oldSupplier, { $inc: { outstandingBalance: -oldOwed } }, { session });
        }
        if (newSupplier) {
            await Supplier.findByIdAndUpdate(newSupplier, { $inc: { outstandingBalance: newOwed } }, { session });
        }
    }
    return updated;
};

/**
 * @desc    Add a spare part to a repair
 * @route   POST /api/spare-part-usages
 * @access  Private (Admin/Staff)
 */
export const createSparePartUsage = async (req, res, next) => {
    try {
        const validatedData = sparePartUsageSchema.parse(req.body);
        await checkRecordCap();

        const repair = await verifyRepair(validatedData.repair);

        if (repair.status !== 'in-progress') {
            throw createError(400, 'Spare parts can only be added when repair is in progress');
        }

        if (!repair.technician) {
            throw createError(400, 'Cannot add spare parts — no technician assigned to this repair');
        }
        validatedData.installedBy = repair.technician;
        if (validatedData.supplier) await verifySupplier(validatedData.supplier);

        const sparePartUsage = await withTransaction(async (session) => {
            const [created] = await SparePartUsage.create([validatedData], { session });
            await Repair.findByIdAndUpdate(
                validatedData.repair,
                { $push: { sparePartUsage: created._id } },
                { session }
            );
            if (validatedData.supplier) {
                await Supplier.findByIdAndUpdate(
                    validatedData.supplier,
                    { $inc: { outstandingBalance: (validatedData.unitCost || 0) * (validatedData.quantity || 0) } },
                    { session }
                );
            }
            return created;
        });

        const populated = await populate(SparePartUsage.findById(sparePartUsage._id));

        res.status(201).json({ success: true, data: populated, message: 'Spare part added successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bulk add spare parts to a repair
 * @route   POST /api/spare-part-usages/bulk
 * @access  Private (Admin/Staff)
 */
export const bulkCreateSparePartUsage = async (req, res, next) => {
    try {
        const { repair: repairId, parts } = sparePartUsageBulkCreateSchema.parse(req.body);

        const repair = await verifyRepair(repairId);

        if (repair.status !== 'in-progress') {
            throw createError(400, 'Spare parts can only be added when repair is in progress');
        }

        if (!repair.technician) {
            throw createError(400, 'Cannot add spare parts — no technician assigned to this repair');
        }

        const supplierIds = [...new Set(parts.filter(p => p.supplier).map(p => p.supplier))];
        for (const supplierId of supplierIds) {
            await verifySupplier(supplierId);
        }

        const docs = parts.map(part => ({
            ...part,
            repair: repairId,
            installedBy: repair.technician
        }));

        const supplierTotals = {};
        for (const part of parts) {
            if (!part.supplier) continue;
            supplierTotals[part.supplier] = (supplierTotals[part.supplier] || 0) + (part.unitCost || 0) * (part.quantity || 0);
        }

        const created = await withTransaction(async (session) => {
            const result = await SparePartUsage.create(docs, { session });
            await Repair.findByIdAndUpdate(
                repairId,
                { $push: { sparePartUsage: { $each: result.map(p => p._id) } } },
                { session }
            );
            await Promise.all(
                Object.entries(supplierTotals).map(([supplierId, total]) =>
                    Supplier.findByIdAndUpdate(supplierId, { $inc: { outstandingBalance: total } }, { session })
                )
            );
            return result;
        });

        res.status(201).json({ success: true, data: created, message: `${created.length} spare parts added successfully` });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all spare part usages
 * @route   GET /api/spare-part-usages
 * @access  Private (Admin/Staff)
 */
export const getSparePartUsages = async (req, res, next) => {
    try {
        const { page, limit, sortBy, sortOrder, repair, supplier, paymentStatus } = sparePartUsageQuerySchema.parse(req.query);

        const query = { isDeleted: false };
        if (repair) query.repair = repair;
        if (supplier) query.supplier = supplier;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [sparePartUsages, total] = await Promise.all([
            populate(SparePartUsage.find(query))
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            SparePartUsage.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: sparePartUsages,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single spare part usage
 * @route   GET /api/spare-part-usages/:id
 * @access  Private (Admin/Staff)
 */
export const getSparePartUsageById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const sparePartUsage = await populate(
            SparePartUsage.findOne({ _id: id, isDeleted: false })
        );

        if (!sparePartUsage) {
            return res.status(404).json({ success: false, message: 'Spare part usage not found' });
        }

        res.json({ success: true, data: sparePartUsage });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a spare part usage
 * @route   PATCH /api/spare-part-usages/:id
 * @access  Private (Admin/Staff)
 */
export const updateSparePartUsage = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const validatedData = sparePartUsageUpdateSchema.parse(req.body);
        if (validatedData.supplier) await verifySupplier(validatedData.supplier);

        const updated = await withTransaction((session) => updatePartInTx(id, validatedData, session));
        const populated = await populate(SparePartUsage.findById(updated._id));

        res.json({ success: true, data: populated, message: 'Spare part updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bulk update spare part usages
 * @route   PATCH /api/spare-part-usages/bulk
 * @access  Private (Admin/Staff)
 */
export const bulkUpdateSparePartUsage = async (req, res, next) => {
    try {
        const { updates } = sparePartUsageBulkUpdateSchema.parse(req.body);

        for (const { data } of updates) {
            if (data.supplier) await verifySupplier(data.supplier);
        }

        const results = await withTransaction(async (session) => {
            const out = [];
            for (const { id, data } of updates) {
                out.push(await updatePartInTx(id, data, session)); // sequential on purpose: one session
            }
            return out;
        });

        res.json({ success: true, data: results, message: `${results.length} spare parts updated successfully` });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Soft delete a spare part usage (only if unpaid and repair is in progress)
 * @route   DELETE /api/spare-part-usages/:id
 * @access  Private (Admin/Staff)
 */
export const deleteSparePartUsage = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        await withTransaction(async (session) => {
            const part = await SparePartUsage.findOne({ _id: id, isDeleted: false }).session(session);
            if (!part) throw createError(404, 'Spare part usage not found');

            if ((part.amountPaid ?? 0) > 0) {
                throw createError(400, 'Cannot remove a spare part after payment has been made');
            }

            await assertRepairInProgress(part.repair, session);

            await SparePartUsage.findByIdAndUpdate(part._id, { isDeleted: true }, { session });
            await Repair.findByIdAndUpdate(part.repair, { $pull: { sparePartUsage: part._id } }, { session });

            if (part.supplier) {
                await Supplier.findByIdAndUpdate(
                    part.supplier,
                    { $inc: { outstandingBalance: -partOwed(part) } },
                    { session }
                );
            }
        });

        res.json({ success: true, message: 'Spare part deleted successfully' });
    } catch (error) {
        next(error);
    }
};