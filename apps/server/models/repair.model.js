import mongoose from 'mongoose';
import Counter from './counter.model.js';
import { PAYMENT_METHODS, PAYMENT_STATUS, STATUS_OPTIONS } from '@repo/validators';
import { rounded } from '../utils/common/roundedNumber.js';
import { orgScopePlugin } from '../utils/common/orgScope.plugin.js';
import { getRequestContext } from '../utils/common/requestContext.js';

const repairSchema = new mongoose.Schema(
    {
        repairId: { type: String },
        status: { type: String, enum: STATUS_OPTIONS, default: 'received' },
        paymentStatus: { type: String, enum: PAYMENT_STATUS, default: 'unpaid' },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
        technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        deviceModel: { type: String, required: true, trim: true },
        imei: { type: String, trim: true },
        problem: { type: String, required: true, trim: true },
        accessories: { type: String, trim: true },
        serviceCharge: rounded({ required: true, min: 0 }),
        discount: rounded({ default: 0, min: 0 }),
        dueDate: { type: Date },
        completedAt: { type: Date },
        isPickedUp: { type: Boolean, default: false },
        pickedUpAt: { type: Date },
        sparePartUsage: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SparePartUsage' }],
        notes: { type: String, trim: true },
        amountPaid: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false, select: false }
    }, { timestamps: true, versionKey: false }
);

repairSchema.pre('save', async function (next) {
    if (!this.repairId) {
        const ctx = getRequestContext();
        const orgKey = ctx?.orgId?.toString() ?? 'global';
        const counter = await Counter.findByIdAndUpdate(
            `repairId:${orgKey}`,
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.repairId = `REP-${String(counter.seq).padStart(4, '0')}`;
    }

    if (this.isModified('status') && this.status === 'completed') {
        this.completedAt = new Date();
    }

    next();
});

repairSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; } });
repairSchema.set('toObject', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; } });

repairSchema.index({ customer: 1 });
repairSchema.index({ technician: 1 });
repairSchema.index({ status: 1 });
repairSchema.index({ isDeleted: 1, status: 1 });
repairSchema.index({ createdAt: -1 });
repairSchema.index({ deviceModel: 'text', imei: 'text', problem: 'text' });

repairSchema.plugin(orgScopePlugin, {countsTowardsCap: true});
repairSchema.index({ orgId: 1, repairId: 1 }, { unique: true });

export default mongoose.model('Repair', repairSchema);