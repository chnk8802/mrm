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
  getCustomerStats,
  restoreCustomer
} from '../controllers/customer.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Static named routes FIRST
router.route('/stats')
  .get(authorize('admin'), getCustomerStats);

router.route('/bulk')
  .patch(authorize('manager'), bulkUpdateCustomers)
  .delete(authorize('admin'), bulkDeleteCustomers);

// Dynamic :id routes AFTER
router.route('/')
  .get(authorize('staff'), getCustomers)
  .post(authorize('staff'), createCustomer);

router.route('/:id')
  .get(authorize('staff'), getCustomerById)
  .patch(authorize('staff'), updateCustomer)
  .delete(authorize('admin'), deleteCustomer);

router.patch('/:id/restore', authorize('admin'), restoreCustomer);

router.route('/:id/permanent')
  .delete(authorize('superadmin'), permanentlyDeleteCustomer);

export default router;
