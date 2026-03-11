import Supplier from '../models/Supplier.js';
import { supplierSchema, supplierUpdateSchema, supplierQuerySchema } from '@repo/validators';

// @desc    Create a new supplier
// @route   POST /api/suppliers
// @access  Private
export const createSupplier = async(req, res) => {
    try {
        const validatedData = supplierSchema.parse(req.body);

        const supplier = new Supplier(validatedData);
        const savedSupplier = await supplier.save();

        res.status(201).json({
            success: true,
            data: savedSupplier,
            message: 'Supplier created successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error creating supplier:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create supplier'
        });
    }
};

// @desc    Get all suppliers with pagination, sorting, and filtering
// @route   GET /api/suppliers
// @access  Private
export const getSuppliers = async(req, res) => {
    try {
        const queryParams = supplierQuerySchema.parse(req.query);

        const {
            page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                search,
                isActive
        } = queryParams;

        // Build query
        const query = {};

        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by active status
        if (isActive !== undefined) {
            query.isActive = isActive;
        }

        // Sort configuration
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const suppliers = await Supplier.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        // Get total count
        const total = await Supplier.countDocuments(query);

        res.json({
            success: true,
            data: suppliers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            count: suppliers.length,
            total
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error getting suppliers:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get suppliers'
        });
    }
};

// @desc    Get single supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private
export const getSupplierById = async(req, res) => {
    try {
        const { id } = req.params;

        const supplier = await Supplier.findById(id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        res.json({
            success: true,
            data: supplier
        });
    } catch (error) {
        console.error('Error getting supplier:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get supplier'
        });
    }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
export const updateSupplier = async(req, res) => {
    try {
        const { id } = req.params;
        const validatedData = supplierUpdateSchema.parse(req.body);

        const supplier = await Supplier.findById(id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        Object.assign(supplier, validatedData);
        const updatedSupplier = await supplier.save();

        res.json({
            success: true,
            data: updatedSupplier,
            message: 'Supplier updated successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error updating supplier:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update supplier'
        });
    }
};

// @desc    Delete supplier (soft delete)
// @route   DELETE /api/suppliers/:id
// @access  Private
export const deleteSupplier = async(req, res) => {
    try {
        const { id } = req.params;

        const supplier = await Supplier.findById(id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        // Soft delete
        supplier.isActive = false;
        await supplier.save();

        res.json({
            success: true,
            message: 'Supplier deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete supplier'
        });
    }
};

// @desc    Get supplier statistics
// @route   GET /api/suppliers/stats
// @access  Private
export const getSupplierStats = async(req, res) => {
    try {
        const totalSuppliers = await Supplier.countDocuments({ isActive: true });

        res.json({
            success: true,
            data: {
                totalSuppliers
            }
        });
    } catch (error) {
        console.error('Error getting supplier stats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get supplier statistics'
        });
    }
};