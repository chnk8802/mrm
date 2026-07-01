import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Organization from '../models/organization.model.js';
import generateToken from '../utils/generateToken.js';
import { createError } from '../utils/common/errorHandler.js';
import { registerSchema, loginSchema } from '@repo/validators';

const cookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
    };
};

const userResponse = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    avatar: user.avatar
});

/**
 * @desc    Register first superadmin
 * @route   POST /api/auth/register
 * @access  Public (one time only)
 */
export const registerUser = async (req, res, next) => {
    try {
        const validatedData = registerSchema.parse(req.body);

        const superAdminExists = await User.findOne({ role: 'superadmin' });
        if (superAdminExists) {
            throw createError(403, 'A superadmin already exists');
        }

        const userExists = await User.findOne({ email: validatedData.email, isDeleted: false });
        if (userExists) {
            throw createError(400, 'User with this email already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validatedData.password, salt);

        const user = await User.create({
            ...validatedData,
            password: hashedPassword,
            role: 'superadmin'
        });

        res.cookie('token', generateToken(user._id), cookieOptions());

        res.status(201).json({
            success: true,
            data: userResponse(user),
            message: 'Superadmin registered successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await User.findOne({ email, isActive: true, isDeleted: false }).select('+password');
        if (!user) throw createError(401, 'Invalid email or password');

        if (user.role !== 'superadmin') {
            const org = await Organization.findById(user.orgId);
            if (!org || !org.isActive || org.isDeleted) {
                throw createError(403, 'This organization no longer has access. Contact support.');
            }
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw createError(401, 'Invalid email or password');

        res.cookie('token', generateToken(user._id), cookieOptions());

        res.json({ success: true, data: userResponse(user) });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get logged in user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.user.id, isActive: true, isDeleted: false });
        if (!user) throw createError(404, 'User not found');

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update logged in user profile
 * @route   PATCH /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, address, password, avatar } = req.body;

        const user = await User.findOne({ _id: req.user.id, isActive: true, isDeleted: false }).select('+password');
        if (!user) throw createError(404, 'User not found');

        if (name)    user.name    = name;
        if (phone)   user.phone   = phone;
        if (avatar)  user.avatar  = avatar;

        // handle nested address update
        if (address) {
            user.address = { ...user.address?.toObject(), ...address };
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.json({ success: true, data: userResponse(user), message: 'Profile updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = async (req, res, next) => {
    try {
        res.clearCookie('token', cookieOptions());
        res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        next(error);
    }
};