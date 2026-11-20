import mongoose from 'mongoose';
import { getRequestContext } from './requestContext.js';

const QUERY_HOOKS = [
    'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete',
    'findOneAndRemove', 'countDocuments', 'updateMany', 'updateOne',
    'deleteMany', 'deleteOne'
];

export const orgScopePlugin = (schema, options = {}) => {
    const { addField = true, countsTowardCap = false } = options;

    if (addField) {
        schema.add({
            orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
        });
        schema.index({ orgId: 1 });
    }

    // Marker read by checkRecordCap: models flagged here are counted toward the plan cap
    if (countsTowardCap) {
        schema.options.countsTowardCap = true;
    }

    // Auto-filter every read/update/delete query
    schema.pre(QUERY_HOOKS, function (next) {
        if (this.getOptions().skipOrgScope) return next();
        const ctx = getRequestContext();
        if (!ctx) return next();
        if (!ctx.orgId) {
            if (ctx.role === 'superadmin') return next();
            return next(new Error('Missing organization context for scoped query'));
        }
        this.where({ orgId: ctx.orgId });
        next();
    });

    // Auto-filter aggregation pipelines (these don't go through the hooks above)
    schema.pre('aggregate', function (next) {
        const ctx = getRequestContext();
        if (!ctx) return next();
        if (!ctx.orgId) {
            if (ctx.role === 'superadmin') return next();
            return next(new Error('Missing organization context for scoped query'));
        }
        this.pipeline().unshift({ $match: { orgId: ctx.orgId } });
        next();
    });

    // Auto-tag new documents at creation time
    schema.pre('validate', function (next) {
        if (this.isNew && !this.orgId) {
            const ctx = getRequestContext();
            if (ctx) {
                if (!ctx.orgId) {
                    if (ctx.role === 'superadmin') return next();
                    return next(new Error('Missing organization context for scoped query'));
                }
                this.orgId = ctx.orgId;
            }
        }
        next();
    });
};