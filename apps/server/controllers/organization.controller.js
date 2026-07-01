import bcrypt from 'bcryptjs';
import Organization from '../models/organization.model.js';
import User from '../models/user.model.js';
import { createError } from '../utils/common/errorHandler.js';
import withTransaction from '../utils/common/withTransaction.js';
import { createOrganizationSchema, organizationQuerySchema } from '@repo/validators';

/**
 * @desc    Create a new organization + its first admin user
 * @route   POST /api/platform/organizations
 * @access  Private (Superadmin only)
 */
export const createOrganization = async (req, res, next) => {
    try {
        const { name, contactEmail, contactPhone, admin } = createOrganizationSchema.parse(req.body);

        const existingUser = await User.findOne({ email: admin.email, isDeleted: false });
        if (existingUser) throw createError(400, 'A user with this email already exists');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(admin.password, salt);

        const result = await withTransaction(async (session) => {
            const [org] = await Organization.create([{ name, contactEmail, contactPhone }], { session });

            const [adminUser] = await User.create([{
                name: admin.name,
                email: admin.email,
                password: hashedPassword,
                phone: admin.phone,
                role: 'admin',
                orgId: org._id
            }], { session });

            return { org, adminUser };
        });

        res.status(201).json({
            success: true,
            data: {
                organization: result.org,
                admin: {
                    _id: result.adminUser._id,
                    name: result.adminUser.name,
                    email: result.adminUser.email,
                    role: result.adminUser.role
                }
            },
            message: 'Organization and admin created successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get the current user's organization
 * @route   GET /api/organizations/me
 * @access  Private (Admin/Manager/Staff)
 */
export const getMyOrganization = async (req, res, next) => {
    try {
        if (req.user.role === 'superadmin') {
            throw createError(400, 'Superadmin is not tied to an organization');
        }

        const org = await Organization.findById(req.user.orgId).select('name plan isActive');
        if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

        res.json({ success: true, data: org });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all organizations with pagination, sorting, and search
 * @route   GET /api/platform/organizations
 * @access  Private (Superadmin only)
 */
export const getOrganizations = async (req, res, next) => {
    try {
        const { page, limit, sortBy, sortOrder, search, isActive } = organizationQuerySchema.parse(req.query);

        const query = { isDeleted: false };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { contactEmail: { $regex: search, $options: 'i' } },
            ];
        }

        if (isActive !== undefined) query.isActive = isActive;

        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [organizations, total] = await Promise.all([
            Organization.find(query).sort(sortOptions).skip(skip).limit(limit),
            Organization.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: organizations,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};