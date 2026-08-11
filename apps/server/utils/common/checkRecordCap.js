import Organization from '../../models/organization.model.js';
import { createError } from './errorHandler.js';
import { getRequestContext } from './requestContext.js';

/**
 * Throws if the current request's org has hit its plan's pooled recordCap.
 * Reads orgId from the same AsyncLocalStorage context orgScopePlugin uses,
 * so it stays consistent with the org-select header for superadmin.
 * No-ops for superadmin with no org selected — there's no single org to
 * check a cap against in that state.
 */
export const checkRecordCap = async () => {
    const ctx = getRequestContext();
    if (!ctx?.orgId) return;

    const org = await Organization.findById(ctx.orgId).populate('subscription.planId', 'recordCap');
    if (!org) throw createError(404, 'Organization not found');

    if (org.subscription.capsOverride) return;

    if (org.subscription.recordCount >= org.subscription.planId.recordCap) {
        throw createError(
            403,
            `Record limit reached for your plan (${org.subscription.planId.recordCap} max). Contact support to upgrade.`
        );
    }
};