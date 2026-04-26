import mongoose from 'mongoose';

const sparePartUsageSchema = new mongoose.Schema({
    repair: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repair',
        required: true
    },
    sparePart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SparePart',
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
    totalCost: {
        type: Number,
        default: 0,
        min: 0
    },
    isInventoryItem: {
        type: Boolean,
        default: false,
    },
    warrantyStartDate: {
        type: Date
    },
    warrantyEndDate: {
        type: Date
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
    }
}, {
    timestamps: true
});

// Indexes for performance optimization
sparePartUsageSchema.index({ repair: 1 });
sparePartUsageSchema.index({ sparePart: 1 });
sparePartUsageSchema.index({ supplier: 1 });
sparePartUsageSchema.index({ installedAt: -1 });

// Calculate totalCost before saving
sparePartUsageSchema.pre('save', function(next) {
    this.totalCost = this.quantity * this.unitCost;
    next();
});

export default mongoose.model('SparePartUsage', sparePartUsageSchema);