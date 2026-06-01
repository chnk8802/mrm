import mongoose from 'mongoose';

export const PAYMENT_METHODS = ['cash', 'upi', 'card', 'bank_transfer'];
export const PAYMENT_TYPES = ['receivable', 'payable'];

const paymentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: PAYMENT_TYPES,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: PAYMENT_METHODS,
        required: true
    },
    paidAt: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    lineItems: [{
        repair: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Repair'
        },
        sparePartUsage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SparePartUsage'
        },
        amountPaid: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    isFullAndFinal: {
        type: Boolean,
        default: false
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

paymentSchema.index({ type: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ supplier: 1 });
paymentSchema.index({ recordedBy: 1 });
paymentSchema.index({ paidAt: -1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ isDeleted: 1, type: 1 });

paymentSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => {
    delete ret.id;
    return ret;
}});
paymentSchema.set('toObject', { virtuals: true, transform: (doc, ret) => {
    delete ret.id;
    return ret;
}});

export default mongoose.model('Payment', paymentSchema);