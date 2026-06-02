import { isValidObjectId } from 'mongoose';
import Repair from '../models/repair.model.js';
import Customer from '../models/customer.model.js';
import User from '../models/user.model.js';
import {
    repairSchema,
    repairUpdateSchema,
    repairQuerySchema,
    assignTechnicianSchema,
    statusUpdateSchema,
    pickupSchema
} from '@repo/validators';
import { transitionHandlers, transitionRepairStatus } from '../blueprints/repair.blueprint.js';
import { createError } from '../utils/errorHandler.js';

/**
 * @desc Create a new repair order
 * @route POST /api/repairs
 * @access Private (Admin/Staff)
 */
export const createRepair = async (req, res, next) => {
    try {
        const validatedData = repairSchema.parse(req.body);

        const customer = await Customer.findOne({ _id: validatedData.customer, isDeleted: false, isActive: true });
        if (!customer) {
            throw createError(404, 'Customer not found');
        }

        if (validatedData.technician) {
            const technician = await User.findOne({ _id: validatedData.technician, isDeleted: false, isActive: true });
            if (!technician || technician.role !== 'staff') {
                throw createError(400, 'Invalid technician');
            }
        }

        const repair = await Repair.create(validatedData);

        await repair.populate('customer', 'name phone customerType');
        await repair.populate('technician', 'name email phone');

        res.status(201).json({
            success: true,
            data: repair,
            message: 'Repair order created successfully'
        });
    } catch (error) {
        next(error)
    }
};

/** 
* @desc  Get all repairs with pagination, sorting, and filtering
* @route   GET /api/repairs
* @access  Private (Admin/Staff/Technician)
*/
export const getRepairs = async (req, res, next) => {
    try {
        const { page, limit, sortBy, sortOrder, search, status, customer, technician, isPickedUp } = repairQuerySchema.parse(req.query);

        const query = { isDeleted: false };

        if (search) {
            query.$or = [
                { repairId: { $regex: search, $options: 'i' } },
                { deviceModel: { $regex: search, $options: 'i' } },
                { imei: { $regex: search, $options: 'i' } },
                { problem: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (customer) query.customer = customer;
        if (technician) query.technician = technician;
        if (isPickedUp !== undefined) query.isPickedUp = isPickedUp;

        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [repairs, total] = await Promise.all([
            Repair.find(query)
                .populate('customer', 'name phone customerType')
                .populate('technician', 'name email phone')
                .populate('sparePartUsage')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            Repair.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: repairs,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error)
    }
};

/**
*  @desc    Get single repair by ID
*  @route   GET /api/repairs/:id
*  @access  Private (Admin/Staff/Technician)
*/
export const getRepairById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const repair = await Repair.findOne({ _id: id, isDeleted: false })
            .populate('customer', 'name phone email address customerType')
            .populate('technician', 'name email phone')
            .populate('sparePartUsage');

        if (!repair) throw createError(404, 'Repair not found');

        res.json({ success: true, data: repair });
    } catch (error) {
        next(error)
    }
};

/** 
*  @desc    Update a repair
*  @route   PUT /api/repairs/:id
*  @access  Private (Admin/Staff)
*/
export const updateRepair = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const validatedData = repairUpdateSchema.parse(req.body);

        if (validatedData.customer) {
            const customer = await Customer.findOne({ _id: validatedData.customer, isDeleted: false });
            if (!customer) throw createError(404, 'Customer not found');
        }

        if (validatedData.technician) {
            const technician = await User.findOne({ _id: validatedData.technician, isDeleted: false, isActive: true });
            if (!technician || technician.role !== 'staff') {
                throw createError(400, 'Invalid technician');
            }
        }

        const repair = await Repair.findOneAndUpdate(
            { _id: id, isDeleted: false },
            validatedData,
            { new: true, runValidators: true }
        )
            .populate('customer', 'name phone customerType')
            .populate('technician', 'name email phone');

        if (!repair)
            throw createError(404, 'Repair not found');

        res.json({ success: true, data: repair, message: 'Repair updated successfully' });
    } catch (error) {
        next(error)
    }
};

/**  
*  @desc    Assign a technician to a repair order
*  @route   PUT /api/repairs/:id/assign
*  @access  Private (Admin/Staff)
*/
export const assignTechnician = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const { technicianId } = assignTechnicianSchema.parse(req.body);

        const repair = await Repair.findOne({ _id: id, isDeleted: false });
        if (!repair) throw res.status(404).json({ success: false, message: 'Repair not found' });

        if (repair.status !== 'received') {
            throw createError(400, 'Technician can only be assigned when repair is in received state');
        }

        const technician = await User.findOne({ _id: technicianId, isDeleted: false, isActive: true });
        if (!technician || technician.role !== 'staff') {
            throw createError(400, 'Invalid technician');
        }

        repair.technician = technicianId;
        await transitionRepairStatus(repair, 'in-progress');

        await repair.populate('customer', 'name phone customerType');
        await repair.populate('technician', 'name email phone');

        res.json({ success: true, data: repair, message: 'Technician assigned successfully' });
    } catch (error) {
        next(error)
    }
};

/** 
*  @desc    Update repair status
*  @route   PATCH /api/repairs/:id/status
*  @access  Private (Admin/Staff)
*/
export const updateRepairStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const { status: newStatus } = statusUpdateSchema.parse(req.body);

        const repair = await Repair.findOne({ _id: id, isDeleted: false });
        if (!repair) throw createError(404, 'Repair not found'); 
            
        await transitionRepairStatus(repair, newStatus);

        res.json({ success: true, data: repair, message: `Status updated to '${newStatus}'` });
    } catch (error) {
        next(error)
    }
};

/**
 * @desc    Mark device as picked up
 * @route   PATCH /api/repairs/:id/pickup
 * @access  Private (Admin/Staff)
 */
export const pickupRepair = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const { pickedUpAt } = pickupSchema.parse(req.body);

        const repair = await Repair.findOne({ _id: id, isDeleted: false });
        if (!repair) throw createError(404, 'Repair not found'); 

        if (!['ready', 'not-repairable'].includes(repair.status)) {
            throw createError(400, 'Device can only be picked up when status is ready or not-repairable'); 
        }

        if (repair.isPickedUp) {
            throw createError(400, 'Device already picked up');
        }

        repair.isPickedUp = true;
        repair.pickedUpAt = pickedUpAt || new Date();

        // ready → completed on pickup, not-repairable stays as is
        if (repair.status === 'ready') {
            repair.status = 'completed';
            repair.completedAt = new Date();
        }

        await repair.save();

        await repair.populate('customer', 'name phone customerType');
        await repair.populate('technician', 'name email phone');

        res.json({ success: true, data: repair, message: 'Device picked up successfully' });
    } catch (error) {
        next(error)
    }
};

/**
 * @desc    Get repair statistics
 * @route   GET /api/repairs/stats
 * @access  Private (Admin)
 */
export const getRepairStats = async (req, res, next) => {
    try {
        const stats = await Repair.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    received: { $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
                    ready: { $sum: { $cond: [{ $eq: ['$status', 'ready'] }, 1, 0] } },
                    notRepairable: { $sum: { $cond: [{ $eq: ['$status', 'not-repairable'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'completed'] },
                                { $subtract: ['$serviceCharge', '$discount'] },
                                0
                            ]
                        }
                    }
                }
            },
            { $project: { _id: 0 } }
        ]);

        res.json({ success: true, data: stats[0] || {} });
    } catch (error) {
        next(error)
    }
};

/**
 * @desc    Soft delete a repair
 * @route   DELETE /api/repairs/:id
 * @access  Private (Admin only)
 */
export const deleteRepair = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const repair = await Repair.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );

        if (!repair) throw createError(404, 'Repair not found');

        res.json({ success: true, message: 'Repair deleted successfully' });
    } catch (error) {
        next(error)
    }
};

/**
 * @desc    Restore a soft deleted repair
 * @route   PATCH /api/repairs/:id/restore
 * @access  Private (Admin only)
 */
export const restoreRepair = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const repair = await Repair.findOne({ _id: id }).select('+isDeleted');
        if (!repair) throw createError(404, 'Repair not found');

        if (!repair.isDeleted) {
            throw createError(400, 'Repair is not deleted');
        }

        repair.isDeleted = false;
        await repair.save();

        res.json({ success: true, message: 'Repair restored successfully' });
    } catch (error) {
        next(error)
    }
};