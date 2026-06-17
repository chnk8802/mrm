import express from 'express';
import {
    createPayment,
    createFullAndFinalPayment,
    getPayments,
    getPaymentById,
    getPaymentStats
} from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import authorize from '../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', authorize('manager'), getPaymentStats);

router.post('/full-and-final', authorize('manager'), createFullAndFinalPayment);

router.route('/')
    .get(authorize('manager'), getPayments)
    .post(authorize('manager'), createPayment);

router.route('/:id')
    .get(authorize('manager'), getPaymentById);

export default router;