import mongoose from 'mongoose';
import { ROLES } from '@repo/validators';
import { orgScopePlugin } from '../utils/common/orgScope.plugin.js';

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: [20, 'user\'s name cannot exceed 20 characters'] },
        email: { type: String, required: true, trim: true, lowercase: true },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: ROLES, required: true },
        phone: { type: String, required: true, trim: true, maxlength: [20, 'Phone number cannot exceed 20 characters'] },
        address: {
            street: { type: String, trim: true, maxlength: [200, 'Street address cannot exceed 200 characters'] },
            city: { type: String, trim: true, maxlength: [100, 'City cannot exceed 100 characters'] },
            state: { type: String, trim: true, maxlength: [100, 'State cannot exceed 100 characters'] },
            postalCode: { type: String, trim: true, maxlength: [20, 'Postal code cannot exceed 20 characters'] },
            country: { type: String, trim: true, maxlength: [100, 'Country cannot exceed 100 characters'], }
        },
        avatar: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false, select: false },
        orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: function () { return this.role !== 'superadmin'; } },
        mustChangePassword: { type: Boolean, default: false },
        passwordChangedAt: { type: Date },
    },
    { timestamps: true, versionKey: false }
);

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ name: 'text', email: 'text', phone: 'text' });
userSchema.index({ createdAt: -1 });
userSchema.index({ orgId: 1 });

userSchema.virtual('fullAddress').get(function () {
    const parts = [];
    if (this.address?.street) parts.push(this.address.street);
    if (this.address?.city) parts.push(this.address.city);
    if (this.address?.state) parts.push(this.address.state);
    if (this.address?.postalCode) parts.push(this.address.postalCode);
    if (this.address?.country) parts.push(this.address.country);
    return parts.join(', ');
});

userSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; } });
userSchema.set('toObject', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; } });

userSchema.plugin(orgScopePlugin, { addField: false , countsTowardCap: true});

export default mongoose.model('User', userSchema);