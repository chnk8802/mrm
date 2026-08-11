import { PAYMENT_METHODS, PAYMENT_STATUS } from '@repo/validators';
import mongoose from 'mongoose';
import { rounded } from '../utils/common/roundedNumber.js';
import { orgScopePlugin } from '../utils/common/orgScope.plugin.js';

const sparePartUsageSchema = new mongoose.Schema(
    {
        repair: { type: mongoose.Schema.Types.ObjectId, ref: 'Repair', required: true },
        sparePart: { type: String, trim: true, minlength: 3, required: true },
        supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
        quantity: { type: Number, default: 1, min: 1 },
        unitCost: rounded({ default: 0, min: 0 }),
        amountPaid: rounded({ default: 0 }),
        paymentStatus: { type: String, enum: PAYMENT_STATUS, default: "unpaid" },
        installedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        installedAt: { type: Date, default: Date.now },
        notes: { type: String, trim: true },
        isDeleted: { type: Boolean, default: false, select: false }
    },
    { timestamps: true, versionKey: false });

sparePartUsageSchema.index({ repair: 1 });
sparePartUsageSchema.index({ supplier: 1 });
sparePartUsageSchema.index({ installedAt: -1 });

sparePartUsageSchema.plugin(orgScopePlugin, {countsTowardCap: true});

export default mongoose.model('SparePartUsage', sparePartUsageSchema);