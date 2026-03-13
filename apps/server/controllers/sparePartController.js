import mongoose from 'mongoose';
import SparePart from '../models/SparePart.js';
import {
    sparePartSchema,
    sparePartUpdateSchema,
    sparePartQuerySchema,
    sparePartUsageSchema,
    sparePartUsageUpdateSchema
} from '@repo/validators';

// @desc    Create a new spare part
// @route   POST /api/spare-parts
// @access  Private
export const createSparePart = async(req, res) => {
    try {
        const validatedData = sparePartSchema.parse(req.body);

        const sparePart = new SparePart(validatedData);
        const savedSparePart = await sparePart.save();

        res.status(201).json({
            success: true,
            data: savedSparePart,
            message: 'Spare part created successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Part number already exists'
            });
        }
        console.error('Error creating spare part:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create spare part'
        });
    }
};

// @desc    Get all spare parts with pagination, sorting, and filtering
// @route   GET /api/spare-parts
// @access  Private
export const getSpareParts = async(req, res) => {
    try {
        const queryParams = sparePartQuerySchema.parse(req.query);

        const {
            page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                search,
                category,
                isActive,
                isInUse
        } = queryParams;

        // Build query
        const query = {};

        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { partNumber: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by active status
        if (isActive !== undefined) {
            query.isActive = isActive;
        }

        // Filter by in-use status
        if (isInUse !== undefined) {
            query.isInUse = isInUse;
        }

        // Sort configuration
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const spareParts = await SparePart.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        // Get total count
        const total = await SparePart.countDocuments(query);

        res.json({
            success: true,
            data: spareParts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            count: spareParts.length,
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
        console.error('Error getting spare parts:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get spare parts'
        });
    }
};

// @desc    Get single spare part by ID
// @route   GET /api/spare-parts/:id
// @access  Private
export const getSparePartById = async(req, res) => {
    try {
        const { id } = req.params;

        const sparePart = await SparePart.findById(id);

        if (!sparePart) {
            return res.status(404).json({
                success: false,
                message: 'Spare part not found'
            });
        }

        res.json({
            success: true,
            data: sparePart
        });
    } catch (error) {
        console.error('Error getting spare part:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get spare part'
        });
    }
};

// @desc    Update spare part
// @route   PUT /api/spare-parts/:id
// @access  Private
export const updateSparePart = async(req, res) => {
    try {
        const { id } = req.params;
        const validatedData = sparePartUpdateSchema.parse(req.body);

        const sparePart = await SparePart.findById(id);

        if (!sparePart) {
            return res.status(404).json({
                success: false,
                message: 'Spare part not found'
            });
        }

        // If updating part number, check for duplicates
        if (validatedData.partNumber && validatedData.partNumber !== sparePart.partNumber) {
            const existingPart = await SparePart.findOne({ partNumber: validatedData.partNumber });
            if (existingPart) {
                return res.status(400).json({
                    success: false,
                    message: 'Part number already exists'
                });
            }
        }

        Object.assign(sparePart, validatedData);
        const updatedSparePart = await sparePart.save();

        res.json({
            success: true,
            data: updatedSparePart,
            message: 'Spare part updated successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error updating spare part:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update spare part'
        });
    }
};

// @desc    Delete spare part (soft delete - set isActive to false)
// @route   DELETE /api/spare-parts/:id
// @access  Private
export const deleteSparePart = async(req, res) => {
    try {
        const { id } = req.params;

        const sparePart = await SparePart.findById(id);

        if (!sparePart) {
            return res.status(404).json({
                success: false,
                message: 'Spare part not found'
            });
        }

        // Soft delete - set isActive to false
        sparePart.isActive = false;
        await sparePart.save();

        res.json({
            success: true,
            message: 'Spare part deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting spare part:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete spare part'
        });
    }
};

// @desc    Get spare part statistics
// @route   GET /api/spare-parts/stats
// @access  Private
export const getSparePartStats = async(req, res) => {
    try {
        const totalParts = await SparePart.countDocuments({ isActive: true });

        const categoryStats = await SparePart.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        const supplierStats = await SparePart.aggregate([
            { $match: { isActive: true, supplier: { $ne: null } } },
            {
                $group: {
                    _id: '$supplier',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalParts,
                categoryStats,
                supplierStats
            }
        });
    } catch (error) {
        console.error('Error getting spare part stats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get spare part statistics'
        });
    }
};

// @desc    Get spare parts by supplier
// @route   GET /api/spare-parts/by-supplier/:supplierId
// @access  Private
export const getSparePartsBySupplier = async(req, res) => {
    try {
        const { supplierId } = req.params;

        const spareParts = await SparePart.find({
            supplier: supplierId,
            isActive: true
        }).sort({ name: 1 });

        res.json({
            success: true,
            data: spareParts,
            count: spareParts.length
        });
    } catch (error) {
        console.error('Error getting spare parts by supplier:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get spare parts by supplier'
        });
    }
};

// =====================
// Spare Parts Usage in Repairs
// =====================

import SparePartUsage from '../models/SparePartUsage.js';

// @desc    Add spare parts to a repair
// @desc    Add spare part to a repair
// @route   POST /api/spare-parts/usage
// @access  Private
export const addSparePartsToRepair = async(req, res) => {
    try {
        // Get repairId from body (new API structure)
        const { repairId, sparePartId, supplierId, quantity, unitCost, warrantyStartDate, warrantyEndDate, notes } = req.body;

        // Basic validation - ensure required fields exist
        if (!repairId) {
            return res.status(400).json({
                success: false,
                message: 'Repair ID is required'
            });
        }

        if (!sparePartId) {
            return res.status(400).json({
                success: false,
                message: 'Spare part ID is required'
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(sparePartId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid spare part ID'
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(repairId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid repair ID'
            });
        }

        // Check if repair exists
        const Repair = (await
            import ('../models/Repair.js')).default;
        const repair = await Repair.findById(repairId);
        if (!repair) {
            return res.status(404).json({
                success: false,
                message: 'Repair not found'
            });
        }

        // Check if spare part exists
        const sparePart = await SparePart.findById(sparePartId);
        if (!sparePart) {
            return res.status(404).json({
                success: false,
                message: 'Spare part not found'
            });
        }

        // Check if this spare part is already used in this repair
        const existingUsage = await SparePartUsage.findOne({
            repair: repairId,
            sparePart: sparePartId
        });
        if (existingUsage) {
            return res.status(400).json({
                success: false,
                message: 'This spare part is already used in this repair order. Please edit the existing entry instead.'
            });
        }

        // Create usage record
        const sparePartUsage = new SparePartUsage({
            repair: repairId,
            sparePart: sparePartId,
            supplier: supplierId ? supplierId : null,
            quantity,
            unitCost,
            warrantyStartDate,
            warrantyEndDate,
            installedBy: req.user.id,
            notes
        });

        await sparePartUsage.save();

        // Mark spare part as in use
        sparePart.isInUse = true;
        await sparePart.save();

        // Update repair's costPrice with total spare parts cost
        const allSparePartsUsage = await SparePartUsage.find({ repair: repairId });
        const totalSparePartsCost = allSparePartsUsage.reduce((sum, usage) => sum + (usage.totalCost || 0), 0);
        repair.costPrice = totalSparePartsCost;
        await repair.save();

        // Populate the response
        await sparePartUsage.populate('repair', 'repairNumber device brand model');
        await sparePartUsage.populate('sparePart', 'name partNumber category');
        await sparePartUsage.populate('supplier', 'name');

        res.status(201).json({
            success: true,
            data: sparePartUsage,
            message: 'Spare part added to repair successfully'
        });
    } catch (error) {
        console.error('Error adding spare parts to repair:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to add spare parts to repair'
        });
    }
};

// @desc    Get spare parts by repair
// @route   GET /api/spare-parts/usage/by-repair/:repairId
// @access  Private
export const getSparePartsByRepair = async(req, res) => {
    try {
        const { repairId } = req.params;

        if (!repairId || !/^[0-9a-fA-F]{24}$/.test(repairId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid repair ID'
            });
        }

        const spareParts = await SparePartUsage.find({ repair: repairId })
            .populate('sparePart', 'name partNumber category')
            .populate('supplier', 'name')
            .populate('installedBy', 'name')
            .sort({ installedAt: -1 });

        res.json({
            success: true,
            data: spareParts,
            count: spareParts.length
        });
    } catch (error) {
        console.error('Error getting spare parts by repair:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get spare parts'
        });
    }
};

// @desc    Update spare part usage
// @route   PUT /api/spare-parts/usage/:id
// @access  Private
export const updateSparePartUsage = async(req, res) => {
    try {
        const { id } = req.params;
        const { quantity, unitCost, supplierId, warrantyStartDate, warrantyEndDate, notes } = req.body;

        const sparePartUsage = await SparePartUsage.findById(id);
        if (!sparePartUsage) {
            return res.status(404).json({
                success: false,
                message: 'Spare part usage not found'
            });
        }

        // Update fields if provided
        if (quantity !== undefined) sparePartUsage.quantity = quantity;
        if (unitCost !== undefined) sparePartUsage.unitCost = unitCost;
        if (supplierId !== undefined) sparePartUsage.supplier = supplierId || null;
        if (warrantyStartDate !== undefined) sparePartUsage.warrantyStartDate = warrantyStartDate;
        if (warrantyEndDate !== undefined) sparePartUsage.warrantyEndDate = warrantyEndDate;
        if (notes !== undefined) sparePartUsage.notes = notes;

        await sparePartUsage.save();

        // Update repair's costPrice with total spare parts cost
        const Repair = (await import('../models/Repair.js')).default;
        const allSparePartsUsage = await SparePartUsage.find({ repair: sparePartUsage.repair });
        const totalSparePartsCost = allSparePartsUsage.reduce((sum, usage) => sum + (usage.totalCost || 0), 0);
        await Repair.findByIdAndUpdate(sparePartUsage.repair, { costPrice: totalSparePartsCost });

        // Populate response
        await sparePartUsage.populate('repair', 'repairNumber device');
        await sparePartUsage.populate('sparePart', 'name partNumber');
        await sparePartUsage.populate('supplier', 'name');

        res.json({
            success: true,
            data: sparePartUsage,
            message: 'Spare part usage updated successfully'
        });
    } catch (error) {
        console.error('Error updating spare part usage:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update spare part usage'
        });
    }
};

// @desc    Remove spare part from repair
// @route   DELETE /api/spare-parts/usage/:id
// @access  Private
export const removeSparePartFromRepair = async(req, res) => {
    try {
        const { id } = req.params;

        const sparePartUsage = await SparePartUsage.findById(id);
        if (!sparePartUsage) {
            return res.status(404).json({
                success: false,
                message: 'Spare part usage not found'
            });
        }

        const repairId = sparePartUsage.repair;
        const sparePartId = sparePartUsage.sparePart;

        await sparePartUsage.deleteOne();

        // Check if this spare part is still used in any other repair
        const remainingUsage = await SparePartUsage.find({ sparePart: sparePartId });
        const sparePartDoc = await SparePart.findById(sparePartId);
        if (sparePartDoc) {
            sparePartDoc.isInUse = remainingUsage.length > 0;
            await sparePartDoc.save();
        }

        // Update repair's costPrice with remaining spare parts cost
        const Repair = (await import('../models/Repair.js')).default;
        const allSparePartsUsage = await SparePartUsage.find({ repair: repairId });
        const totalSparePartsCost = allSparePartsUsage.reduce((sum, usage) => sum + (usage.totalCost || 0), 0);
        await Repair.findByIdAndUpdate(repairId, { costPrice: totalSparePartsCost });

        res.json({
            success: true,
            message: 'Spare part removed from repair successfully'
        });
    } catch (error) {
        console.error('Error removing spare part from repair:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to remove spare part from repair'
        });
    }
};

// ============================================
// New Separate SparePartUsage Module Functions
// ============================================

// @desc    Get all spare part usage records
// @route   GET /api/spare-parts/usage
// @access  Private
export const getSparePartsUsage = async(req, res) => {
    try {
        const { page = 1, limit = 20, repairId, sparePartId, supplierId } = req.query;

        const query = {};
        if (repairId) query.repair = repairId;
        if (sparePartId) query.sparePart = sparePartId;
        if (supplierId) query.supplier = supplierId;

        const total = await SparePartUsage.countDocuments(query);
        const usages = await SparePartUsage.find(query)
            .populate('repair', 'repairNumber device brand model status')
            .populate('sparePart', 'name partNumber category')
            .populate('supplier', 'name')
            .populate('installedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: usages,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting spare part usage:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get spare part usage'
        });
    }
};

// @desc    Get spare part usage by ID
// @route   GET /api/spare-parts/usage/:id
// @access  Private
export const getSparePartUsageById = async(req, res) => {
    try {
        const { id } = req.params;

        const usage = await SparePartUsage.findById(id)
            .populate('repair')
            .populate('sparePart')
            .populate('supplier')
            .populate('installedBy', 'name email');

        if (!usage) {
            return res.status(404).json({
                success: false,
                message: 'Spare part usage not found'
            });
        }

        res.json({
            success: true,
            data: usage
        });
    } catch (error) {
        console.error('Error getting spare part usage by ID:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get spare part usage'
        });
    }
};

// @desc    Get spare part usage by supplier
// @route   GET /api/spare-parts/usage/by-supplier/:supplierId
// @access  Private
export const getSparePartsUsageBySupplier = async(req, res) => {
    try {
        const { supplierId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const query = { supplier: supplierId };

        const total = await SparePartUsage.countDocuments(query);
        const usages = await SparePartUsage.find(query)
            .populate('repair', 'repairNumber device brand model status')
            .populate('sparePart', 'name partNumber category')
            .populate('supplier', 'name')
            .populate('installedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: usages,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting spare part usage by supplier:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get spare part usage by supplier'
        });
    }
};