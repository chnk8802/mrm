import express from 'express';
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
    restoreSupplier,
    permanentlyDeleteSupplier,
    bulkUpdateSuppliers,
    bulkDeleteSuppliers,
    getSupplierStats
} from '../controllers/supplier.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js.js';

const router = express.Router();

router.use(protect);

router.get('/stats', authorize('admin'), getSupplierStats);

router.patch('/bulk', authorize('admin'), bulkUpdateSuppliers);
router.delete('/bulk', authorize('admin'), bulkDeleteSuppliers);

router.route('/')
    .get(authorize('staff'), getSuppliers)
    .post(authorize('manager'), createSupplier);

router.route('/:id')
    .get(authorize('staff'), getSupplierById)
    .patch(authorize('manager'), updateSupplier)
    .delete(authorize('admin'), deleteSupplier);

router.patch('/:id/restore', authorize('admin'), restoreSupplier);
router.delete('/:id/permanent', authorize('superadmin'), permanentlyDeleteSupplier);

export default router;

// import express from 'express';
// import {
//     createSupplier,
//     getSuppliers,
//     getSupplierById,
//     updateSupplier,
//     deleteSupplier,
//     getSupplierStats
// } from '../controllers/supplier.controller.js';
// import { protect } from '../middleware/authMiddleware.js';

// const router = express.Router();

// // All routes require authentication
// router.use(protect);

// // Statistics route
// router.route('/stats')
//     .get(getSupplierStats);

// // CRUD routes
// router.route('/')
//     .get(getSuppliers)
//     .post(createSupplier);

// router.route('/:id')
//     .get(getSupplierById)
//     .put(updateSupplier)
//     .delete(deleteSupplier);

// export default router;