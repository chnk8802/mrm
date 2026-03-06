import express from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  permanentlyDeleteCustomer,
  bulkUpdateCustomers,
  bulkDeleteCustomers,
  getCustomerStats
} from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Statistics route
router.route('/stats')
  .get(getCustomerStats);

// Bulk operations
router.route('/bulk')
  .put(bulkUpdateCustomers)
  .delete(bulkDeleteCustomers);

// CRUD routes
router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

// Permanent delete route
router.route('/:id/permanent')
  .delete(permanentlyDeleteCustomer);

export default router;
