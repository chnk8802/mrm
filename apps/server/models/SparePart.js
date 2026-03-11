import mongoose from 'mongoose';

// Category options for spare parts
const CATEGORY_OPTIONS = [
    'screen',
    'battery',
    'camera',
    'charging-port',
    'speaker',
    'microphone',
    'motherboard',
    'sim-tray',
    'back-panel',
    'other'
];

const sparePartSchema = new mongoose.Schema({
    partNumber: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: CATEGORY_OPTIONS,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Auto-generate part number before saving
sparePartSchema.pre('save', async function(next) {
    if (!this.partNumber) {
        const count = await mongoose.model('SparePart').countDocuments();
        this.partNumber = `SP-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Indexes for performance optimization
sparePartSchema.index({ partNumber: 1 });
sparePartSchema.index({ name: 'text', description: 'text' });
sparePartSchema.index({ category: 1 });
sparePartSchema.index({ isActive: 1 });

export default mongoose.model('SparePart', sparePartSchema);
export { CATEGORY_OPTIONS };