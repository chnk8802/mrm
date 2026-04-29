import { isValidObjectId } from 'mongoose';
import Customer from '../models/Customer.js';
import { customerSchema, customerUpdateSchema, customerBulkUpdateSchema, customerQuerySchema } from '@repo/validators';
import { customerBulkDeleteSchema } from '@repo/validators/src/customer.schema.js';

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res) => {
  try {
    const validatedData = customerSchema.parse(req.body);

    const customer = new Customer(validatedData);

    const savedCustomer = await customer.save();

    res.status(201).json({
      success: true,
      data: savedCustomer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create customer'
    });
  }
};

// @desc    Get all customers with pagination, sorting, and filtering
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
  try {
    // Validate query parameters
    const queryParams = customerQuerySchema.parse(req.query);

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      customerType,
      isActive
    } = queryParams;

    // Build query
    const query = { isDeleted: false };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by customer type
    if (customerType) {
      query.customerType = customerType;
    }

    // Sort configuration
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const customers = await Customer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      count: customers.length,
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
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customers'
    });
  }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const customer = await Customer.findOne({ _id: id, isDeleted: false });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customer'
    });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }
    const validatedData = customerUpdateSchema.parse(req.body);

    const customer = await Customer.findOneAndUpdate(
      { _id: id, isDeleted: false },
      validatedData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update customer'
    });
  }
};

// @desc    Delete a customer (soft delete - sets isDeleted to false)
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    // TODO: check for active RepairJobs before deleting
    // const hasActiveJobs = await RepairJob.exists({ customer: id, status: { $nin: ['completed', 'cancelled'] } });
    // if (hasActiveJobs) return res.status(400).json({ success: false, message: 'Customer has active repair jobs' });

    const customer = await Customer.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete customer'
    });
  }
};

// @desc    Restore a soft-deleted customer
// @route   PATCH /api/customers/:id/restore
// @access  Private
export const restoreCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const customer = await Customer.findById(id).select('+isDeleted');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!customer.isDeleted) {
      return res.status(400).json({ success: false, message: 'Customer is not deleted' });
    }

    customer.isDeleted = false;
    await customer.save();

    res.json({ success: true, message: 'Customer restored successfully' });
  } catch (error) {
    console.error('Error restoring customer:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to restore customer' });
  }
};

// @desc    Hard delete a customer
// @route   DELETE /api/customers/:id/permanent
// @access  Private (Admin only - can be extended)
export const permanentlyDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }
    const customer = await Customer.findOne({ _id: id, isDeleted: true }).select('+isDeleted');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found or not soft-deleted' });
    }

    await Customer.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Customer permanently deleted'
    });
  } catch (error) {
    console.error('Error permanently deleting customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to permanently delete customer'
    });
  }
};

// @desc    Bulk update customers
// @route   PUT /api/customers/bulk
// @access  Private
export const bulkUpdateCustomers = async (req, res) => {
  try {
    const { ids, data } = customerBulkUpdateSchema.parse(req.body);

    const result = await Customer.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { $set: data }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No customers were updated. They may not exist or are deleted.'
      });
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} customers updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    console.error('Error bulk updating customers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to bulk update customers'
    });
  }
};

// @desc    Bulk delete customers
// @route   DELETE /api/customers/bulk
// @access  Private
export const bulkDeleteCustomers = async (req, res) => {
  try {
    const { ids } = customerBulkDeleteSchema.parse(req.body);

    // TODO: check for active RepairJobs before bulk deleting

    const result = await Customer.updateMany(
      { _id: { $in: ids } },
      { isDeleted: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} customers deleted successfully`,
      deletedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk deleting customers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to bulk delete customers'
    });
  }
};

// @desc    Get customer count statistics
// @route   GET /api/customers/stats
// @access  Private
export const getCustomerStats = async (req, res) => {
  try {
    const stats = await Customer.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          business: { $sum: { $cond: [{ $eq: ['$customerType', 'business'] }, 1, 0] } },
          individual: { $sum: { $cond: [{ $eq: ['$customerType', 'individual'] }, 1, 0] } },
        }
      }
    ]);

    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customer statistics'
    });
  }
};
