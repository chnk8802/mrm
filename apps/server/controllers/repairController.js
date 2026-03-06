import Repair from '../models/Repair.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import {
    repairSchema,
    repairUpdateSchema,
    repairQuerySchema,
    repairIdSchema,
    assignTechnicianSchema,
    completeRepairSchema
} from '@repo/validators';

// @desc    Create a new repair order
// @route   POST /api/repairs
// @access  Private (Admin/Staff)
export const createRepair = async(req, res) => {
    try {
        const validatedData = repairSchema.parse(req.body);

        // Verify customer exists
        const customer = await Customer.findById(validatedData.customer);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Verify technician if provided
        if (validatedData.technician) {
            const technician = await User.findById(validatedData.technician);
            if (!technician || technician.role !== 'technician') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid technician'
                });
            }
        }

        // Create repair order
        const repair = await Repair.create(validatedData);

        // Populate customer and technician
        await repair.populate('customer', 'name phone customerType');
        await repair.populate('technician', 'name email phone');

        res.status(201).json({
            success: true,
            data: repair,
            message: 'Repair order created successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error creating repair:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create repair order'
        });
    }
};

// @desc    Get all repairs with pagination, sorting, and filtering
// @route   GET /api/repairs
// @access  Private (Admin/Staff/Technician)
export const getRepairs = async(req, res) => {
    try {
        const queryParams = repairQuerySchema.parse(req.query);

        const {
            page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                search,
                status,
                customer,
                technician,
                priority
        } = queryParams;

        // Build query
        const query = { isActive: true };

        // Search functionality
        if (search) {
            query.$or = [
                { repairId: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { imei: { $regex: search, $options: 'i' } },
                { problem: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by customer
        if (customer) {
            query.customer = customer;
        }

        // Filter by technician
        if (technician) {
            query.technician = technician;
        }

        // Filter by priority
        if (priority) {
            query.priority = priority;
        }

        // Sort configuration
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const repairs = await Repair.find(query)
            .populate('customer', 'name phone customerType')
            .populate('technician', 'name email phone')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        // Get total count
        const total = await Repair.countDocuments(query);

        res.json({
            success: true,
            data: repairs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            count: repairs.length,
            total
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: error.errors
            });
        }
        console.error('Error fetching repairs:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch repairs'
        });
    }
};

// @desc    Get single repair by ID
// @route   GET /api/repairs/:id
// @access  Private (Admin/Staff/Technician)
export const getRepairById = async(req, res) => {
    try {
        const { id } = req.params;

        const repair = await Repair.findById(id)
            .populate('customer', 'name phone email address customerType')
            .populate('technician', 'name email phone');

        if (!repair) {
            return res.status(404).json({
                success: false,
                message: 'Repair not found'
            });
        }

        res.json({
            success: true,
            data: repair
        });
    } catch (error) {
        console.error('Error fetching repair:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch repair'
        });
    }
};

// @desc    Update a repair
// @route   PUT /api/repairs/:id
// @access  Private (Admin/Staff)
export const updateRepair = async(req, res) => {
    try {
        const { id } = req.params;
        const validatedData = repairUpdateSchema.parse(req.body);

        // If updating customer, verify exists
        if (validatedData.customer) {
            const customer = await Customer.findById(validatedData.customer);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }
        }

        // If updating technician, verify valid
        if (validatedData.technician) {
            const technician = await User.findById(validatedData.technician);
            if (!technician || technician.role !== 'technician') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid technician'
                });
            }
        }

        const repair = await Repair.findByIdAndUpdate(
                id,
                validatedData, { new: true, runValidators: true }
            )
            .populate('customer', 'name phone customerType')
            .populate('technician', 'name email phone');

        if (!repair) {
            return res.status(404).json({
                success: false,
                message: 'Repair not found'
            });
        }

        res.json({
            success: true,
            data: repair,
            message: 'Repair updated successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error updating repair:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update repair'
        });
    }
};

// @desc    Delete a repair (soft delete)
// @route   DELETE /api/repairs/:id
// @access  Private (Admin only)
export const deleteRepair = async(req, res) => {
    try {
        const { id } = req.params;

        const repair = await Repair.findByIdAndUpdate(
            id, { isActive: false }, { new: true }
        );

        if (!repair) {
            return res.status(404).json({
                success: false,
                message: 'Repair not found'
            });
        }

        res.json({
            success: true,
            message: 'Repair deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting repair:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete repair'
        });
    }
};

// @desc    Assign a technician to a repair order
// @route   PUT /api/repairs/:id/assign
// @access  Private (Admin/Staff)
export const assignTechnician = async(req, res) => {
    try {
        const { id } = req.params;
        const { technicianId } = assignTechnicianSchema.parse(req.body);

        // Verify technician exists and is a technician
        const technician = await User.findById(technicianId);
        if (!technician || technician.role !== 'technician') {
            return res.status(400).json({
                success: false,
                message: 'Invalid technician'
            });
        }

        const repair = await Repair.findByIdAndUpdate(
                id, {
                    technician: technicianId,
                    status: 'in-progress'
                }, { new: true }
            )
            .populate('customer', 'name phone customerType')
            .populate('technician', 'name email phone');

        if (!repair) {
            return res.status(404).json({
                success: false,
                message: 'Repair not found'
            });
        }

        res.json({
            success: true,
            data: repair,
            message: 'Technician assigned successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error assigning technician:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to assign technician'
        });
    }
};

// @desc    Complete a repair order
// @route   PUT /api/repairs/:id/complete
// @access  Private (Admin/Technician)
export const completeRepair = async(req, res) => {
    try {
        const { id } = req.params;
        const validatedData = completeRepairSchema.parse(req.body);

        const repair = await Repair.findById(id);

        if (!repair) {
            return res.status(404).json({
                success: false,
                message: 'Repair not found'
            });
        }

        if (repair.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Repair is already completed'
            });
        }

        // Update repair
        repair.status = 'completed';
        repair.completedAt = new Date();

        if (validatedData.repairPrice !== undefined) {
            repair.repairPrice = validatedData.repairPrice;
        }
        if (validatedData.costPrice !== undefined) {
            repair.costPrice = validatedData.costPrice;
        }
        if (validatedData.notes) {
            repair.notes.push(validatedData.notes);
        }

        await repair.save();

        await repair.populate('customer', 'name phone customerType');
        await repair.populate('technician', 'name email phone');

        res.json({
            success: true,
            data: repair,
            message: 'Repair completed successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error completing repair:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to complete repair'
        });
    }
};

// @desc    Get repair statistics
// @route   GET /api/repairs/stats
// @access  Private (Admin)
export const getRepairStats = async(req, res) => {
    try {
        const total = await Repair.countDocuments({ isActive: true });
        const pending = await Repair.countDocuments({ status: 'pending', isActive: true });
        const inProgress = await Repair.countDocuments({ status: 'in-progress', isActive: true });
        const completed = await Repair.countDocuments({ status: 'completed', isActive: true });
        const cancelled = await Repair.countDocuments({ status: 'cancelled', isActive: true });

        // Get revenue stats
        const completedRepairs = await Repair.find({ status: 'completed', isActive: true });
        const totalRevenue = completedRepairs.reduce((sum, r) => sum + (r.repairPrice || 0), 0);
        const totalCost = completedRepairs.reduce((sum, r) => sum + (r.costPrice || 0), 0);

        res.json({
            success: true,
            data: {
                total,
                pending,
                inProgress,
                completed,
                cancelled,
                totalRevenue,
                totalCost,
                profit: totalRevenue - totalCost
            }
        });
    } catch (error) {
        console.error('Error fetching repair stats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch repair statistics'
        });
    }
};