import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { createError } from '../utils/errorHandler.js';
import { registerSchema, loginSchema } from '@repo/validators';
import { flattenObject } from '../utils/flattenObject.js';

const cookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
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

// import User from '../models/User.js';
// import bcrypt from 'bcryptjs';
// import generateToken from '../utils/generateToken.js';

// // @desc    Register a new user
// // @route   POST /api/auth/register
// // @access  Public
// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, phone, address, role = 'superadmin' } = req.body;

//     if (role === 'superadmin') {
//       const superAdminExists = await User.findOne({ role: 'superadmin' });
//       if (superAdminExists) {
//         return res.status(403).json({
//           success: false,
//           message: 'A superadmin already exists'
//         });
//       }
//     }

//     // Check if user exists
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({
//         success: false,
//         message: 'User already exists'
//       });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       phone,
//       address,
//       role
//     });

//     if (user) {
//       const token = generateToken(user._id);

//       // For development (localhost), use lax; for production use strict
//       const isProduction = process.env.NODE_ENV === 'production';

//       res.cookie('token', token, {
//         httpOnly: true,
//         secure: isProduction,
//         sameSite: isProduction ? 'strict' : 'lax',
//         maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
//       });

//       res.status(201).json({
//         success: true,
//         data: {
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//           phone: user.phone,
//           address: user.address,
//           role: user.role
//         }
//       });
//     } else {
//       res.status(400).json({
//         success: false,
//         message: 'Invalid user data'
//       });
//     }
//   } catch (error) {
//     console.error('Register error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Authenticate a user
// // @route   POST /api/auth/login
// // @access  Public
// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user by email
//     const user = await User.findOne({
//       email,
//       isActive: true,
//       isDeleted: false
//     }).select('+password');

//     // Check if user exists
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     // Check if password matches
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     const token = generateToken(user._id);

//     // For development (localhost), use lax; for production use strict
//     const isProduction = process.env.NODE_ENV === 'production';

//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: isProduction,
//       sameSite: isProduction ? 'strict' : 'lax',
//       maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
//     });

//     res.json({
//       success: true,
//       data: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         address: user.address,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Get user profile
// // @route   GET /api/auth/profile
// // @access  Private
// export const getProfile = async (req, res) => {
//   try {
//     const user = await User.findOne({ _id: req.user.id, isActive: true }).select('-password -__v');

//     if (user) {
//       res.json({
//         success: true,
//         data: user
//       });
//     } else {
//       res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Update user profile
// // @route   PUT /api/auth/profile
// // @access  Private
// export const updateProfile = async (req, res) => {
//   try {
//     const user = await User.findOne({ _id: req.user.id, isActive: true });

//     if (user) {
//       user.name = req.body.name || user.name;
//       user.phone = req.body.phone || user.phone;
//       user.address = req.body.address || user.address;

//       if (req.body.password) {
//         const salt = await bcrypt.genSalt(10);
//         user.password = await bcrypt.hash(req.body.password, salt);
//       }

//       const updatedUser = await user.save();

//       res.json({
//         success: true,
//         data: {
//           _id: updatedUser._id,
//           name: updatedUser.name,
//           email: updatedUser.email,
//           phone: updatedUser.phone,
//           address: updatedUser.address,
//           role: updatedUser.role,
//           avatar: updatedUser.avatar,
//           ...(req.body.password && { token: generateToken(updatedUser._id) })
//         }
//       });
//     } else {
//       res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Logout user
// // @route   POST /api/auth/logout
// // @access  Public
// export const logoutUser = async (req, res) => {
//   try {
//     const isProduction = process.env.NODE_ENV === 'production';

//     res.clearCookie('token', {
//       httpOnly: true,
//       secure: isProduction,
//       sameSite: isProduction ? 'strict' : 'lax'
//     });

//     res.json({
//       success: true,
//       message: 'Logout successful'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
