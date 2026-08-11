import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: [50, 'Name cannot exceed 50 characters'] },
        slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
        userCap: { type: Number, required: true, min: 0 },
        recordCap: { type: Number, required: true, min: 0 },
        isDefault: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true, versionKey: false }
);

planSchema.index({ isActive: 1 });

planSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; } });
planSchema.set('toObject', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; } });

export default mongoose.model('Plan', planSchema);