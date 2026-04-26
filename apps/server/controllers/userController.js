import User from "../models/User.js";
import bcrypt from "bcryptjs";
import {
  userSchema,
  userUpdateSchema,
  userBulkUpdateSchema,
  userQuerySchema,
  resetPasswordSchema,
} from "@repo/validators";

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin only - can be extended with RBAC)
export const createUser = async (req, res) => {
  try {
    const validatedData = userSchema.parse(req.body);

    const userExists = await User.findOne({
      email: validatedData.email,
      isDeleted: false,
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // superadmin can only create admin, manager and staff not other roles
    // If role is superadmin, check if superadmin already exists
    if (validatedData.role === "superadmin") {
      const superAdminExists = await User.findOne({
        role: "superadmin",
      });
      if (superAdminExists) {
        return res.status(400).json({
          success: false,
          message:
            "An superadmin already exists. Only one superadmin is allowed.",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const user = await User.create({
      ...validatedData,
      password: hashedPassword,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse,
      message: "User created successfully",
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create user",
    });
  }
};

// @desc    Get all users with pagination, sorting, and filtering
// @route   GET /api/users
// @access  Private (Admin only)
export const getUsers = async (req, res) => {
  try {
    const queryParams = userQuerySchema.parse(req.query);

    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
      role,
      isActive,
    } = queryParams;

    // Build query
    const query = { isDeleted: false };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
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
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select("-password -__v -isDeleted")
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
        pages: Math.ceil(total / limit),
      },
      count: users.length,
      total,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.errors,
      });
    }
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users",
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, isDeleted: false }).select(
      "-password -__v -isDeleted",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user",
    });
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = userUpdateSchema.parse(req.body);

    const existingUser = await User.findOne({ _id: id, isDeleted: false });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    if (
      existingUser.role === "superadmin" &&
      validatedData.role &&
      validatedData.role !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Role for superadmin cannot be changed",
      });
    }

    // Prevent changing role to superadmin if superadmin already exists
    if (validatedData.role === "superadmin") {
      const superAdminExists = await User.findOne({
        role: "superadmin",
        _id: { $ne: id },
      });

      if (superAdminExists) {
        return res.status(400).json({
          success: false,
          message:
            "A superadmin already exists. Only one superadmin is allowed.",
        });
      }
    }

    // If updating email, check for duplicates
    if (validatedData.email) {
      const emailExists = await User.findOne({
        email: validatedData.email,
        _id: { $ne: id },
        isDeleted: false,
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another user",
        });
      }
    }

    const user = await User.findByIdAndUpdate(id, validatedData, {
      new: true,
      runValidators: true,
    }).select("-password -__v -isDeleted");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update user",
    });
  }
};

// @desc    Delete/ a user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self Delete
    if (id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findOne({ _id: id, isDeleted: false });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin cannot be deleted",
      });
    }

    // Soft delete
    user.isDeleted = true;
    await user.save();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete user",
    });
  }
};

// @desc    Restore a soft-deleted user
// @route   PATCH /api/users/:id/restore
// @access  Private (Admin only)
export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "User is not deleted",
      });
    }

    // Check if email is now taken by another active user
    const emailConflict = await User.findOne({
      email: user.email,
      isDeleted: false,
      _id: { $ne: id },
    });

    if (emailConflict) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot restore — email is already in use by another active user",
      });
    }

    user.isDeleted = false;
    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: "User restored successfully",
    });
  } catch (error) {
    console.error("Error restoring user:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to restore user",
    });
  }
};

// @desc    Deactivate a user (soft delete)
// @route   PATCH /api/users/:id/deactivate
// @access  Private (Admin only)
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self deactivate
    if (id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    const user = await User.findOne({ _id: id, isDeleted: false });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "User is already inactive" });
    }

    // Prevent deactivating superadmin
    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin cannot be deactivated",
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to deactivate user",
    });
  }
};

// @desc    Activate a user (restore soft-deleted user)
// @route   PATCH /api/users/:id/activate
// @access  Private (Admin only)
export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, isDeleted: false });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "User is already active" });
    }

    // Activate user
    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: "User activated successfully",
    });
  } catch (error) {
    console.error("Error activating user:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to activate user",
    });
  }
};

// @desc    Permanently delete a user (hard delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUserPermanently = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self delete
    if (id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting superadmin
    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin cannot be deleted",
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "User permanently deleted",
    });
  } catch (error) {
    console.error("Error deleting user permanently:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete user",
    });
  }
};

// @desc    Reset user password
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin only)
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate password
    const validatedData = resetPasswordSchema.parse({ newPassword });

    const user = await User.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};

// @desc    Get user count statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
export const getUserStats = async (req, res) => {
  try {
    const total = await User.countDocuments({ isDeleted: false });
    const active = await User.countDocuments({
      isActive: true,
      isDeleted: false,
    });
    const inactive = await User.countDocuments({
      isActive: false,
      isDeleted: false,
    });
    // and same for each role...
    const superadmin = await User.countDocuments({
      role: "superadmin",
      isDeleted: false,
    });
    const admin = await User.countDocuments({
      role: "admin",
      isDeleted: false,
    });
    const manager = await User.countDocuments({
      role: "manager",
      isDeleted: false,
    });
    const staff = await User.countDocuments({
      role: "staff",
      isDeleted: false,
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        superadmin,
        admin,
        manager,
        staff,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user statistics",
    });
  }
};
