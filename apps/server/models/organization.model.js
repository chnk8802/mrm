import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
        contactEmail: { type: String, trim: true, lowercase: true, maxlength: [100, 'Email cannot exceed 100 characters'] },
        contactPhone: { type: String, trim: true, maxlength: [20, 'Phone number cannot exceed 20 characters'] },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false, select: false }
    },
    { timestamps: true, versionKey: false }
);

organizationSchema.index({ name: 1 });
organizationSchema.index({ isActive: 1, isDeleted: 1 });

organizationSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; } });
organizationSchema.set('toObject', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; } });

export default mongoose.model('Organization', organizationSchema);