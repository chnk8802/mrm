import express from 'express';
import { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer, permanentlyDeleteCustomer, bulkUpdateCustomers, bulkDeleteCustomers, getCustomerStats, restoreCustomer } from '../controllers/customer.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/stats') .get(authorize('admin'), getCustomerStats);
router.route('/bulk') .patch(authorize('manager'), bulkUpdateCustomers) .post(authorize('admin'), bulkDeleteCustomers);
router.route('/') .get(authorize('manager'), getCustomers) .post(authorize('manager'), createCustomer);
router.route('/:id') .get(authorize('manager'), getCustomerById) .patch(authorize('manager'), updateCustomer) .delete(authorize('admin'), deleteCustomer);
router.patch('/:id/restore', authorize('admin'), restoreCustomer);
router.route('/:id/permanent') .delete(authorize('superadmin'), permanentlyDeleteCustomer);

export default router;