import mongoose from 'mongoose';

const sparePartUsageSchema = new mongoose.Schema({
    repair: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repair',
        required: true
    },
    sparePart: {
        type: String,
        trim: true,
        minlength: 3,
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        default: null
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    unitCost: {
        type: Number,
        default: 0,
        min: 0
    },
    installedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    installedAt: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    },isDeleted: {
        type: Boolean,
        default: false,
        select: false 
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for performance optimization
sparePartUsageSchema.index({ repair: 1 });
sparePartUsageSchema.index({ supplier: 1 });
sparePartUsageSchema.index({ installedAt: -1 });

export default mongoose.model('SparePartUsage', sparePartUsageSchema);