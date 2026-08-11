import Plan from '../models/plan.model.js';

/**
 * @desc    Get all active plans (for dropdowns)
 * @route   GET /api/platform/plans
 * @access  Private (Superadmin only)
 */
export const getPlans = async (req, res, next) => {
    try {
        const plans = await Plan.find({ isActive: true }).sort({ userCap: 1 });
        res.json({ success: true, data: plans });
    } catch (error) {
        next(error);
    }
};