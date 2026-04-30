import mongoose from 'mongoose';

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
    /* 
     * WORKFLOW DEFINITIONS:
     * 1. received:       Device checked in; awaiting technician.
     * 2. in-progress:    Technician is actively working or diagnosing.
     * 3. ready:          REPAIR SUCCESSFUL. Device is on the shelf (NOT PICKED UP).
     * 4. not-repairable: REPAIR FAILED. Device is on the shelf (NOT PICKED UP).
     * 5. completed:      SUCCESSFUL pickup. (ready -> completed).
     * 6. cancelled:      Work stopped. Customer took device or rejected quote.
     * 
     * NOTE: To track if a 'not-repairable' device was picked up, 
     * check the 'isPickedUp' boolean field separately.
     * QUESTIONS:
     * 1. I do not want user to randomly choose statuses there must be a strict flow 
     * 2. Will "not-repairable" ever goto completed if yes there will be no tracking shoul di do something to track changes in records? do i need this for all modules?
     * 3. how to track if the device is picked up? both after rapair successfull or not.
     * 4. also, is the payment made and payment can be full, partial, or even customer can take thier phone wihout paying and i have to collect payment later. at some point i want to create a payment module for payble and receivable payments thoughout the system for example.
     *  
     */
    enum: ['received', 'in-progress', 'ready', 'not-repairable', 'completed', 'cancelled'],
    default: 'received'
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