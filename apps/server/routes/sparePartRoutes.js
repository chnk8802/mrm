import express from 'express';
import {
    createSparePart,
    getSpareParts,
    getSparePartById,
    updateSparePart,
    deleteSparePart,
    getSparePartStats,
    getSparePartsBySupplier,
    addSparePartsToRepair,
    getSparePartsByRepair,
    updateSparePartUsage,
    removeSparePartFromRepair,
    getSparePartsUsage,
    getSparePartUsageById,
    getSparePartsUsageBySupplier
} from '../controllers/sparePartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Statistics route
router.route('/stats')
    .get(getSparePartStats);

// Get spare parts by supplier
router.route('/by-supplier/:supplierId')
    .get(getSparePartsBySupplier);

// CRUD routes for Spare Parts
router.route('/')
    .get(getSpareParts)
    .post(createSparePart);

router.route('/:id')
    .get(getSparePartById)
    .put(updateSparePart)
    .delete(deleteSparePart);

// ============================================
// Spare Part Usage Routes (Separate Module)
// ============================================
// These are now independent routes under /api/spare-parts/usage

// Get all spare part usage records
router.route('/usage')
    .get(getSparePartsUsage);

// Add spare part to a repair
router.route('/usage')
    .post(addSparePartsToRepair);

// Get spare parts by repair
router.route('/usage/by-repair/:repairId')
    .get(getSparePartsByRepair);

// Get spare parts by supplier
router.route('/usage/by-supplier/:supplierId')
    .get(getSparePartsUsageBySupplier);

// Get spare part usage by ID
router.route('/usage/:id')
    .get(getSparePartUsageById);

// Update spare part usage
router.route('/usage/:id')
    .put(updateSparePartUsage);

// Delete spare part usage (remove from repair)
router.route('/usage/:id')
    .delete(removeSparePartFromRepair);

export default router;