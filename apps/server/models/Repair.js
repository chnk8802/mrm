import mongoose from 'mongoose';

// Component options
const COMPONENT_OPTIONS = [
    'SIM',
    'SIM Tray',
    'Battery',
    'Back Panel',
    'Screen',
    'Charging Port',
    'Speaker',
    'Microphone',
    'Camera',
    'Fingerprint Sensor',
    'Face ID',
    'WiFi Antenna',
    'Bluetooth Antenna',
    'Motherboard',
    'Other'
];

const repairSchema = new mongoose.Schema({
    repairId: {
        type: String,
        unique: true
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
    model: {
        type: String,
        required: true
    },
    imei: {
        type: String,
        required: true
    },
    problem: {
        type: String,
        required: true
    },
    repairPrice: {
        type: Number,
        required: true,
        min: 0
    },
    costPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    components: [{
        type: String,
        enum: COMPONENT_OPTIONS
    }],
    otherComponent: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    estimatedCompletion: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    notes: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Auto-generate repair ID before saving
repairSchema.pre('save', async function(next) {
    if (!this.repairId) {
        const count = await this.constructor.countDocuments();
        this.repairId = `REP-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Indexes for performance optimization
repairSchema.index({ repairId: 1 });
repairSchema.index({ customer: 1 });
repairSchema.index({ technician: 1 });
repairSchema.index({ status: 1 });
repairSchema.index({ createdAt: -1 });
repairSchema.index({ model: 'text', imei: 'text', problem: 'text' });

export default mongoose.model('Repair', repairSchema);
export { COMPONENT_OPTIONS };