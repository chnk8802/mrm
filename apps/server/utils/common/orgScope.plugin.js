import mongoose from 'mongoose';
import { getRequestContext } from './requestContext.js';

const QUERY_HOOKS = [
    'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete',
    'findOneAndRemove', 'countDocuments', 'updateMany', 'updateOne',
    'deleteMany', 'deleteOne'
];

const DELETE_HOOKS = ['deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove'];

export const orgScopePlugin = (schema, options = {}) => {
    const { addField = true, countsTowardCap = false } = options;

    if (addField) {
        schema.add({
            orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
        });
        schema.index({ orgId: 1 });
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

    if (countsTowardCap) {
        // Capture "was this new" before save flips isNew to false
        schema.pre('save', function (next) {
            this.$locals.wasNew = this.isNew;
            next();
        });

        schema.post('save', async function (doc) {
            if (!doc.$locals.wasNew || !doc.orgId) return;
            await mongoose.model('Organization').updateOne(
                { _id: doc.orgId },
                { $inc: { 'subscription.recordCount': 1 } }
            );
        });

        // Snapshot which orgs are affected before the delete actually runs
        schema.pre(DELETE_HOOKS, async function (next) {
            try {
                const docs = await this.model.find(this.getFilter()).select('orgId').lean();
                this.$locals = this.$locals || {};
                this.$locals.deletedOrgCounts = docs.reduce((acc, d) => {
                    const key = String(d.orgId);
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {});
                next();
            } catch (err) {
                next(err);
            }
        });

        schema.post(DELETE_HOOKS, async function () {
            const counts = this.$locals?.deletedOrgCounts;
            if (!counts) return;
            const Organization = mongoose.model('Organization');
            await Promise.all(
                Object.entries(counts).map(([orgId, count]) =>
                    Organization.updateOne({ _id: orgId }, { $inc: { 'subscription.recordCount': -count } })
                )
            );
        });
    }
};