import mongoose from 'mongoose';
import Counter from './Counter.js';
import { PAYMENT_STATUS, STATUS_OPTIONS } from '@repo/validators';

const repairSchema = new mongoose.Schema({
    repairId: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: STATUS_OPTIONS,
        default: 'received'
    },
    paymentStatus: {
        type: String,
        enum: PAYMENT_STATUS,
        default: 'unpaid'
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deviceModel: {
        type: String,
        required: true,
        trim: true
    },
    imei: {
        type: String,
        required: true,
        trim: true
    },
    problem: {
        type: String,
        required: true,
        trim: true
    },
    accessories: {
        type: String,
        trim: true
    },
    serviceCharge: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    dueDate: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    isPickedUp: {
        type: Boolean,
        default: false
    },
    pickedUpAt: {
        type: Date
    },
    sparePartUsage: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'SparePartUsage'
    }],
    notes: {
        type: String,
        trim: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        select: false
    }
}, {
    timestamps: true,
    versionKey: false
});

// Auto-generate repairId using counter to avoid race conditions
repairSchema.pre('save', async function (next) {
    if (!this.repairId) {
        const counter = await Counter.findByIdAndUpdate(
            'repairId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.repairId = `REP-${String(counter.seq).padStart(4, '0')}`;
    }

    // Auto-set completedAt when status changes to completed
    if (this.isModified('status') && this.status === 'completed') {
        this.completedAt = new Date();
    }

    next();
});

// Remove id virtual, keep virtuals enabled
repairSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret.id;
        return ret;
    }
});
repairSchema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret.id;
        return ret;
    }
});

// Indexes
repairSchema.index({ repairId: 1 });
repairSchema.index({ customer: 1 });
repairSchema.index({ technician: 1 });
repairSchema.index({ status: 1 });
repairSchema.index({ isDeleted: 1, status: 1 });
repairSchema.index({ createdAt: -1 });
repairSchema.index({ deviceModel: 'text', imei: 'text', problem: 'text' });

export default mongoose.model('Repair', repairSchema);