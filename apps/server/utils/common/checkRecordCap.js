import mongoose from 'mongoose';
import Organization from '../../models/organization.model.js';
import { createError } from './errorHandler.js';
import { getRequestContext } from './requestContext.js';

/**
 * Live number of records an org is using: every non-deleted record in
 * every model flagged with orgScopePlugin's countsTowardCap option.
 * Soft-deleted records are not counted, so deleting frees space.
 */
export const countLiveRecords = async (orgId) => {
    const models = mongoose
        .modelNames()
        .map((name) => mongoose.model(name))
        .filter((m) => m.schema.options.countsTowardCap);

    const counts = await Promise.all(
        models.map((m) => m.countDocuments({ orgId, isDeleted: { $ne: true } }))
    );
    return counts.reduce((sum, n) => sum + n, 0);
};

/**
 * Throws if the current request's org has hit its plan's pooled recordCap.
 * Reads orgId from the same AsyncLocalStorage context orgScopePlugin uses,
 * so it stays consistent with the org-select header for superadmin.
 * No-ops for superadmin with no org selected: there's no single org to
 * check a cap against in that state.
 */
export const checkRecordCap = async () => {
    const ctx = getRequestContext();
    if (!ctx?.orgId) return;

    const org = await Organization.findById(ctx.orgId).populate('subscription.planId', 'recordCap');
    if (!org) throw createError(404, 'Organization not found');

    if (org.subscription.capsOverride) return;

    const used = await countLiveRecords(ctx.orgId);
    const cap = org.subscription.planId.recordCap;

    if (used >= cap) {
        throw createError(
            403,
            `Record limit reached for your plan (${cap} max). Delete unused records or contact support to upgrade.`
        );
    }
};