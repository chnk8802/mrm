import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import {
    userSchema,
    userUpdateSchema,
    userBulkUpdateSchema,
    userQuerySchema,
    resetPasswordSchema
} from '@repo/validators';

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin only - can be extended with RBAC)
export const createUser = async(req, res) => {
    try {
        // Validate request body
        const validatedData = userSchema.parse(req.body);

        // Check if user already exists
        const userExists = await User.findOne({ email: validatedData.email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Admin can only create staff and technicians, not other admins
        // If role is admin, check if admin already exists
        if (validatedData.role === 'admin') {
            const adminExists = await User.findOne({ role: 'admin', isActive: true });
            if (adminExists) {
                return res.status(400).json({
                    success: false,
                    message: 'An admin already exists. Only one admin is allowed.'
                });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validatedData.password, salt);

        // Create user
        const user = await User.create({
            ...validatedData,
            password: hashedPassword
        });

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            data: userResponse,
            message: 'User created successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create user'
        });
    }
};

// @desc    Get all users with pagination, sorting, and filtering
// @route   GET /api/users
// @access  Private (Admin only)
export const getUsers = async(req, res) => {
    try {
        // Validate query parameters
        const queryParams = userQuerySchema.parse(req.query);

        const {
            page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                search,
                role,
                isActive
        } = queryParams;

        // Build query
        const query = {};

        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by role
        if (role) {
            query.role = role;
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
        const users = await User.find(query)
            .select('-password')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        // Get total count
        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            count: users.length,
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
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch users'
        });
    }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
export const getUserById = async(req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user'
        });
    }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = async(req, res) => {
    try {
        const { id } = req.params;

        // Validate request body
        const validatedData = userUpdateSchema.parse(req.body);

        // Prevent changing role to admin if admin already exists
        if (validatedData.role === 'admin') {
            const adminExists = await User.findOne({ role: 'admin', isActive: true, _id: { $ne: id } });
            if (adminExists) {
                return res.status(400).json({
                    success: false,
                    message: 'An admin already exists. Only one admin is allowed.'
                });
            }
        }

        // If updating email, check for duplicates
        if (validatedData.email) {
            const emailExists = await User.findOne({
                email: validatedData.email,
                _id: { $ne: id }
            });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another user'
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            id,
            validatedData, { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user,
            message: 'User updated successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update user'
        });
    }
};

// @desc    Delete a user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async(req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        const user = await User.findByIdAndUpdate(
            id, { isActive: false }, { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete user'
        });
    }
};

// @desc    Reset user password
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin only)
export const resetPassword = async(req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        // Validate password
        const validatedData = resetPasswordSchema.parse({ newPassword });

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validatedData.newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Error resetting password:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to reset password'
        });
    }
};

// @desc    Get user count statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
export const getUserStats = async(req, res) => {
    try {
        const total = await User.countDocuments();
        const active = await User.countDocuments({ isActive: true });
        const staff = await User.countDocuments({ role: 'staff' });
        const technician = await User.countDocuments({ role: 'technician' });

        res.json({
            success: true,
            data: {
                total,
                active,
                inactive: total - active,
                staff,
                technician
            }
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user statistics'
        });
    }
};