import bcrypt from 'bcryptjs';
import Organization from '../models/organization.model.js';
import User from '../models/user.model.js';
import { createError } from '../utils/common/errorHandler.js';
import withTransaction from '../utils/common/withTransaction.js';
import { createOrganizationSchema } from '@repo/validators';

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