import mongoose from 'mongoose';
import { isValidObjectId } from 'mongoose';
import Payment from '../models/payment.model.js';
import Repair from '../models/repair.model.js';
import SparePartUsage from '../models/sparePartUsage.model.js';
import Customer from '../models/customer.model.js';
import Supplier from '../models/supplier.model.js';
import { createError } from '../utils/common/errorHandler.js';
import withTransaction from '../utils/common/withTransaction.js';
import { paymentSchema, paymentQuerySchema, paymentFNFSchema } from '@repo/validators';
import { getOutstandingRepairFilter, getOutstandingSparePartFilter, ELIGIBLE_REPAIR_STATUSES } from '../utils/payment.filters.js';
import { getRepairRemaining } from '../utils/repair.calculations.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const populate = (query) => query
    .populate('customer', 'name phone')
    .populate('supplier', 'name phone')
    .populate('recordedBy', 'name email')
    .populate('lineItems.repair', 'repairId deviceModel serviceCharge discount amountPaid paymentStatus')
    .populate('lineItems.sparePartUsage', 'sparePart unitCost quantity amountPaid paymentStatus');

const calculatePaymentStatus = (totalOwed, amountPaid) => {
    if (totalOwed === 0) return 'paid';
    if (amountPaid <= 0) return 'unpaid';
    if (amountPaid >= totalOwed) return 'paid';
    return 'partial';
};

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * @desc    Create a new payment
 * @route   POST /api/payments
 * @access  Private (Manager and above)
 */
export const createPayment = async (req, res, next) => {
    try {
        const validatedData = paymentSchema.parse(req.body);

        validatedData.recordedBy = req.user._id;

        if (validatedData.type === 'receivable') {
            const customer = await Customer.findOne({ _id: validatedData.customer, isDeleted: false });
            if (!customer) throw createError(404, 'Customer not found');
        } else {
            const supplier = await Supplier.findOne({ _id: validatedData.supplier, isDeleted: false });
            if (!supplier) throw createError(404, 'Supplier not found');
        }

        const lineItemDocs = await Promise.all(
            validatedData.lineItems.map(async (item) => {
                if (validatedData.type === 'receivable') {
                    const repair = await Repair.findOne({ _id: item.repair, isDeleted: false });
                    if (!repair) throw createError(404, `Repair ${item.repair} not found`);

                    if (!ELIGIBLE_REPAIR_STATUSES.includes(repair.status)) {
                        throw createError(400, `Repair ${repair.repairId} is not ready for payment yet`);
                    }

                    if (repair.paymentStatus === 'paid') {
                        throw createError(400, `Repair ${repair.repairId} is already fully paid`);
                    }

                    if (repair.paymentStatus === 'waived') {
                        throw createError(400, `Repair ${repair.repairId} has been waived and is not payable`);
                    }

                    const totalOwed = repair.serviceCharge - (repair.discount || 0);
                    const remainingAmount = getRepairRemaining(repair);

                    if (item.amountPaid > remainingAmount) {
                        throw createError(400, `Amount exceeds remaining balance for repair ${repair.repairId}. Remaining: ${remainingAmount}`);
                    }
                    return { doc: repair, type: 'repair', totalOwed };
                } else {
                    const sparePartUsage = await SparePartUsage.findOne({ _id: item.sparePartUsage, isDeleted: false });
                    if (!sparePartUsage) throw createError(404, `Spare part usage ${item.sparePartUsage} not found`);

                    if (sparePartUsage.paymentStatus === 'paid') {
                        throw createError(400, `Spare part ${sparePartUsage.sparePart} is already fully paid`);
                    }

                    const totalOwed = sparePartUsage.unitCost * sparePartUsage.quantity;
                    const remainingAmount = totalOwed - (sparePartUsage.amountPaid || 0);

                    if (item.amountPaid > remainingAmount) {
                        throw createError(400, `Amount exceeds remaining balance for spare part ${sparePartUsage.sparePart}. Remaining: ${remainingAmount}`);
                    }
                    return { doc: sparePartUsage, type: 'sparePartUsage', totalOwed };
                }
            })
        );

        validatedData.totalAmount = validatedData.lineItems.reduce((sum, item) => sum + item.amountPaid, 0);

        const payment = await withTransaction(async (session) => {
            const [created] = await Payment.create([validatedData], { session });

            await Promise.all(
                validatedData.lineItems.map(async (item, index) => {
                    const { doc, type, totalOwed } = lineItemDocs[index];
                    const newAmountPaid = (doc.amountPaid || 0) + item.amountPaid;
                    const newStatus = calculatePaymentStatus(totalOwed, newAmountPaid);

                    if (type === 'repair') {
                        await Repair.findByIdAndUpdate(doc._id, {
                            amountPaid: newAmountPaid,
                            paymentStatus: newStatus
                        }, { session });
                    } else {
                        await SparePartUsage.findByIdAndUpdate(doc._id, {
                            amountPaid: newAmountPaid,
                            paymentStatus: newStatus
                        }, { session });
                    }
                })
            );

            if (validatedData.type === 'receivable') {
                await Customer.findByIdAndUpdate(
                    validatedData.customer,
                    { $inc: { outstandingBalance: -validatedData.totalAmount } },
                    { session }
                );
            } else {
                await Supplier.findByIdAndUpdate(
                    validatedData.supplier,
                    { $inc: { outstandingBalance: -validatedData.totalAmount } },
                    { session }
                );
            }

            return created;
        });

        const populated = await populate(Payment.findById(payment._id));

        res.status(201).json({ success: true, data: populated, message: 'Payment recorded successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── Full and Final ───────────────────────────────────────────────────────────

/**
 * @desc    Create full and final payment
 * @route   POST /api/payments/full-and-final
 * @access  Private (Manager and above)
 */
export const createFullAndFinalPayment = async (req, res, next) => {
    try {
        const { type, customer, supplier, paymentMethod, notes } = paymentFNFSchema.parse(req.body);

        let lineItems = [];
        let totalAmount = 0;

        if (type === 'receivable') {
            const customer_doc = await Customer.findOne({ _id: customer, isDeleted: false });
            if (!customer_doc) throw createError(404, 'Customer not found');

            const unpaidRepairs = await Repair.find(getOutstandingRepairFilter(customer));

            lineItems = unpaidRepairs.map(repair => {
                const totalOwed = repair.serviceCharge - (repair.discount || 0);
                const remaining = totalOwed - (repair.amountPaid || 0);
                totalAmount += remaining;
                return { repair: repair._id, amountPaid: remaining };
            });
        } else {
            const supplier_doc = await Supplier.findOne({ _id: supplier, isDeleted: false });
            if (!supplier_doc) throw createError(404, 'Supplier not found');

            const unpaidParts = await SparePartUsage.find(getOutstandingSparePartFilter(supplier));

            lineItems = unpaidParts.map(part => {
                const totalOwed = part.unitCost * part.quantity;
                const remaining = totalOwed - (part.amountPaid || 0);
                totalAmount += remaining;
                return { sparePartUsage: part._id, amountPaid: remaining };
            });
        }

        if (lineItems.length === 0) throw createError(400, 'No outstanding payments found');

        const payment = await withTransaction(async (session) => {
            const [created] = await Payment.create([{
                type,
                customer: type === 'receivable' ? customer : undefined,
                supplier: type === 'payable' ? supplier : undefined,
                recordedBy: req.user._id,
                paymentMethod,
                notes,
                lineItems,
                totalAmount,
                isFullAndFinal: true
            }], { session });

            if (type === 'receivable') {
                await Promise.all(
                    lineItems.map(item =>
                        Repair.findByIdAndUpdate(
                            item.repair,
                            { $inc: { amountPaid: item.amountPaid }, paymentStatus: 'paid' },
                            { session }
                        )
                    )
                );
                await Customer.findByIdAndUpdate(customer, { outstandingBalance: 0 }, { session });
            } else {
                await Promise.all(
                    lineItems.map(item =>
                        SparePartUsage.findByIdAndUpdate(
                            item.sparePartUsage,
                            { $inc: { amountPaid: item.amountPaid }, paymentStatus: 'paid' },
                            { session }
                        )
                    )
                );
                await Supplier.findByIdAndUpdate(supplier, { outstandingBalance: 0 }, { session });
            }

            return created;
        });

        const populated = await populate(Payment.findById(payment._id));

        res.status(201).json({ success: true, data: populated, message: 'Full and final payment recorded successfully' });
    } catch (error) {
        next(error);
    }
};

export const getOutstandingItems = async (req, res, next) => {
    try {
        const { type, customer, supplier } = req.query;

        if (type === 'receivable') {
            if (!customer) throw createError(400, 'customer is required');
            const customer_doc = await Customer.findOne({ _id: customer, isDeleted: false });
            if (!customer_doc) throw createError(404, 'Customer not found');

            const items = await Repair.find(getOutstandingRepairFilter(customer)).limit(100);
            return res.status(200).json({ success: true, data: items });

        } else if (type === 'payable') {
            if (!supplier) throw createError(400, 'supplier is required');
            const supplier_doc = await Supplier.findOne({ _id: supplier, isDeleted: false });
            if (!supplier_doc) throw createError(404, 'Supplier not found');

            const items = await SparePartUsage.find(getOutstandingSparePartFilter(supplier)).limit(100);
            return res.status(200).json({ success: true, data: items });

        } else {
            throw createError(400, 'Invalid type');
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get outstanding totals for full & final preview
 * @route   GET /api/payments/outstanding-summary
 * @access  Private
 */
export const getOutstandingSummary = async (req, res, next) => {
    try {
        const { type, customer, supplier } = req.query;

        let result = { count: 0, total: 0 };

        if (type === 'receivable') {
            if (!customer) throw createError(400, 'customer is required');
            const customer_doc = await Customer.findOne({ _id: customer, isDeleted: false });
            if (!customer_doc) throw createError(404, 'Customer not found');

            const agg = await Repair.aggregate([
                { $match: getOutstandingRepairFilter(customer) },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        total: {
                            $sum: {
                                $subtract: [
                                    { $subtract: ['$serviceCharge', { $ifNull: ['$discount', 0] }] },
                                    { $ifNull: ['$amountPaid', 0] }
                                ]
                            }
                        }
                    }
                }
            ]);
            if (agg[0]) result = { count: agg[0].count, total: agg[0].total };

        } else if (type === 'payable') {
            if (!supplier) throw createError(400, 'supplier is required');
            const supplier_doc = await Supplier.findOne({ _id: supplier, isDeleted: false });
            if (!supplier_doc) throw createError(404, 'Supplier not found');

            const agg = await SparePartUsage.aggregate([
                { $match: getOutstandingSparePartFilter(supplier) },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        total: {
                            $sum: {
                                $subtract: [
                                    { $multiply: ['$unitCost', '$quantity'] },
                                    { $ifNull: ['$amountPaid', 0] }
                                ]
                            }
                        }
                    }
                }
            ]);
            if (agg[0]) result = { count: agg[0].count, total: agg[0].total };

        } else {
            throw createError(400, 'Invalid type');
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Private (Manager and above)
 */
export const getPayments = async (req, res, next) => {
    try {
        const { page, limit, sortBy, sortOrder, type, customer, supplier, paymentMethod, isFullAndFinal, fromDate, toDate } = paymentQuerySchema.parse(req.query);

        const query = { isDeleted: false };

        if (type) query.type = type;
        if (customer) query.customer = customer;
        if (supplier) query.supplier = supplier;
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (isFullAndFinal !== undefined) query.isFullAndFinal = isFullAndFinal;

        if (fromDate || toDate) {
            query.paidAt = {};
            if (fromDate) query.paidAt.$gte = fromDate;
            if (toDate) query.paidAt.$lte = toDate;
        }

        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [payments, total] = await Promise.all([
            populate(Payment.find(query)).sort(sortOptions).skip(skip).limit(limit),
            Payment.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: payments,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single payment by ID
 * @route   GET /api/payments/:id
 * @access  Private (Manager and above)
 */
export const getPaymentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, "Invalid ID");

        const payment = await populate(Payment.findOne({ _id: id, isDeleted: false }));
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

        res.json({ success: true, data: payment });
    } catch (error) {
        next(error);
    }
};

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * @desc    Get payment statistics
 * @route   GET /api/payments/stats
 * @access  Private (Admin)
 */
export const getPaymentStats = async (req, res, next) => {
    try {
        const stats = await Payment.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalReceivable: { $sum: { $cond: [{ $eq: ['$type', 'receivable'] }, '$totalAmount', 0] } },
                    totalPayable: { $sum: { $cond: [{ $eq: ['$type', 'payable'] }, '$totalAmount', 0] } },
                    totalPayments: { $sum: 1 },
                    receivableCount: { $sum: { $cond: [{ $eq: ['$type', 'receivable'] }, 1, 0] } },
                    payableCount: { $sum: { $cond: [{ $eq: ['$type', 'payable'] }, 1, 0] } },
                }
            },
            {
                $addFields: {
                    grossProfit: { $subtract: ['$totalReceivable', '$totalPayable'] }
                }
            },
            { $project: { _id: 0 } }
        ]);

        res.json({ success: true, data: stats[0] || {} });
    } catch (error) {
        next(error);
    }
};