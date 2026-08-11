import { isValidObjectId } from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Repair from '../models/repair.model.js'
import { createError } from '../utils/common/errorHandler.js';
import { flattenObject } from '../utils/common/flattenObject.js';
import {
    userSchema,
    userUpdateSchema,
    userQuerySchema,
    resetPasswordSchema,
} from '@repo/validators';
import Organization from '../models/organization.model.js';

const canCreate = {
    superadmin: ['admin', 'manager', 'staff'],
    admin: ['manager', 'staff'],
    manager: [],
    staff: []
};

/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Private (Superadmin/Admin)
 */
export const createUser = async (req, res, next) => {
    try {
        const validatedData = userSchema.parse(req.body);

        const allowedRoles = canCreate[req.user.role] || [];
        if (!allowedRoles.includes(validatedData.role)) {
            throw createError(403, `You cannot create a user with role: ${validatedData.role}`);
        }

        if (req.user.role !== 'superadmin') {
            const org = await Organization.findById(req.user.orgId).populate('planId', 'userCap');
            if (!org) throw createError(404, 'Organization not found');

            if (!org.capsOverride) {
                const maxUsers = org.planId.userCap;
                const activeUserCount = await User.countDocuments({ orgId: req.user.orgId, isDeleted: false });

                if (activeUserCount >= maxUsers) {
                    throw createError(403, `User limit reached for your plan (${maxUsers} max). Contact support to upgrade.`);
                }
            }
        }

        const userExists = await User.findOne({ email: validatedData.email }).setOptions({ skipOrgScope: true });;
        if (userExists) throw createError(400, 'User with this email already exists');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validatedData.password, salt);
        const user = await User.create({ ...validatedData, password: hashedPassword });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ success: true, data: userResponse, message: 'User created successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all users with pagination, sorting, and filtering
 * @route   GET /api/users
 * @access  Private (Admin)
 */
export const getUsers = async (req, res, next) => {
    try {
        const { page, limit, sortBy, sortOrder, search, role, isActive } = userQuerySchema.parse(req.query);

        const query = { isDeleted: false };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive;

        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find(query).sort(sortOptions).skip(skip).limit(limit),
            User.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin)
 */
export const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const user = await User.findOne({ _id: id, isDeleted: false });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a user
 * @route   PATCH /api/users/:id
 * @access  Private (Admin)
 */
export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const validatedData = userUpdateSchema.parse(req.body);

        const existingUser = await User.findOne({ _id: id, isDeleted: false });
        if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });

        if (existingUser.role === 'superadmin' && validatedData.role && validatedData.role !== 'superadmin') {
            throw createError(403, 'Role for superadmin cannot be changed');
        }

        if (validatedData.role === 'superadmin') {
            const superAdminExists = await User.findOne({ role: 'superadmin', _id: { $ne: id } }).setOptions({ skipOrgScope: true });
            if (superAdminExists) throw createError(400, 'A superadmin already exists. Only one superadmin is allowed.');
        }

        if (validatedData.role) {
            const allowedRoles = canCreate[req.user.role] || [];
            if (!allowedRoles.includes(validatedData.role)) {
                throw createError(403, `You cannot assign role: ${validatedData.role}`);
            }
        }

        const user = await User.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: flattenObject(validatedData) },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, data: user, message: 'User updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update own password (verifies current password)
 * @route   PUT /api/users/me/password
 * @access  Private
 */
export const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password').setOptions({ skipOrgScope: true });
        if (!user) throw createError(404, 'User not found');

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) throw createError(400, 'Current password is incorrect');

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Soft delete a user
 * @route   DELETE /api/users/:id
 * @access  Private (Superadmin)
 */
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        if (id.toString() === req.user.id.toString()) {
            throw createError(400, 'You cannot delete your own account');
        }

        const user = await User.findOne({ _id: id, isDeleted: false });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.role === 'superadmin') throw createError(403, 'Superadmin cannot be deleted');
        if (user.role === 'admin' && req.user.role === 'admin') {
            throw createError(403, 'Admin cannot delete another admin');
        }

        // check for active repairs assigned to this user before deleting
        const hasRepairs = await Repair.countDocuments({ technician: id, isDeleted: false }) > 0;
        if (hasRepairs) throw createError(400, 'User has repair orders assigned and cannot be deleted');

        user.isDeleted = true;
        await user.save();

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Restore a soft deleted user
 * @route   PATCH /api/users/:id/restore
 * @access  Private (Superadmin)
 */
export const restoreUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const user = await User.findById(id).select('+isDeleted');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.isDeleted) throw createError(400, 'User is not deleted');

        const emailConflict = await User.findOne({ email: user.email, isDeleted: false, _id: { $ne: id } }).setOptions({ skipOrgScope: true });
        if (emailConflict) throw createError(409, 'Cannot restore — email is already in use by another active user');

        user.isDeleted = false;
        user.isActive = true;
        await user.save();

        res.json({ success: true, message: 'User restored successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Deactivate a user
 * @route   PATCH /api/users/:id/deactivate
 * @access  Private (Admin)
 */
export const deactivateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        if (id.toString() === req.user.id.toString()) {
            throw createError(400, 'You cannot deactivate your own account');
        }

        const user = await User.findOne({ _id: id, isDeleted: false });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.role === 'superadmin') throw createError(403, 'Superadmin cannot be deactivated');
        if (!user.isActive) throw createError(400, 'User is already inactive');

        user.isActive = false;
        // TODO: Logout using tokenversion key -> implement later when implementing refresh token logic
        await user.save();

        res.json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Activate a user
 * @route   PATCH /api/users/:id/activate
 * @access  Private (Admin)
 */
export const activateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const user = await User.findOne({ _id: id, isDeleted: false });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.isActive) throw createError(400, 'User is already active');

        user.isActive = true;
        await user.save();

        res.json({ success: true, message: 'User activated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Permanently delete a user
 * @route   DELETE /api/users/:id/permanent
 * @access  Private (Superadmin)
 */
export const deleteUserPermanently = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        if (id.toString() === req.user.id.toString()) {
            throw createError(400, 'You cannot delete your own account');
        }

        const user = await User.findOne({ _id: id, isDeleted: true }).select('+isDeleted');
        if (!user) return res.status(404).json({ success: false, message: 'User not found or not soft deleted' });

        if (user.role === 'superadmin') throw createError(403, 'Superadmin cannot be deleted');

        await User.findByIdAndDelete(id);

        res.json({ success: true, message: 'User permanently deleted' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reset user password
 * @route   PATCH /api/users/:id/reset-password
 * @access  Private (Admin)
 */
export const resetPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError(400, 'Invalid ID');

        const { newPassword } = resetPasswordSchema.parse(req.body);

        const user = await User.findOne({ _id: id, isDeleted: false });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private (Admin)
 */
export const getUserStats = async (req, res, next) => {
    try {
        const stats = await User.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ['$isActive', 1, 0] } },
                    inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
                    superadmin: { $sum: { $cond: [{ $eq: ['$role', 'superadmin'] }, 1, 0] } },
                    admin: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
                    manager: { $sum: { $cond: [{ $eq: ['$role', 'manager'] }, 1, 0] } },
                    staff: { $sum: { $cond: [{ $eq: ['$role', 'staff'] }, 1, 0] } },
                }
            },
            { $project: { _id: 0 } }
        ]);

        res.json({ success: true, data: stats[0] || {} });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all technicians for assignment dropdowns
 * @route   GET /api/technicians
 * @access  Private (Staff)
 */
export const getTechnicians = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { role: 'staff', isActive: true, isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const technicians = await User.find(query).select('name phone email isActive createdAt');
    res.json({ success: true, data: technicians });
  } catch (error) {
    next(error);
  }
};