import mongoose from 'mongoose';
import { rounded } from '../utils/common/roundedNumber.js';
import { orgScopePlugin } from '../utils/common/orgScope.plugin.js';

const supplierSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        address: {
            street: { type: String, trim: true, maxlength: [200, 'Street address cannot exceed 200 characters'] },
            city: { type: String, trim: true, maxlength: [100, 'City cannot exceed 100 characters'] },
            state: { type: String, trim: true, maxlength: [100, 'State cannot exceed 100 characters'] },
            postalCode: { type: String, trim: true, maxlength: [20, 'Postal code cannot exceed 20 characters'] },
            country: { type: String, trim: true, maxlength: [100, 'Country cannot exceed 100 characters'], }
        },
        notes: { type: String, trim: true },
        outstandingBalance: rounded({ default: 0 }),
        isActive: { type: Boolean, default: true },
        isDeleted: {
            type: Boolean, default: false, select: false
        }
    }, { versionKey: false, timestamps: true }
);

supplierSchema.index({ name: 'text', phone: 'text' });
supplierSchema.index({ isActive: 1, isDeleted: 1 });
supplierSchema.index({ createdAt: -1 });

supplierSchema.virtual('fullAddress').get(function () {
    const parts = [];
    if (this.address?.street) parts.push(this.address.street);
    if (this.address?.city) parts.push(this.address.city);
    if (this.address?.state) parts.push(this.address.state);
    if (this.address?.postalCode) parts.push(this.address.postalCode);
    if (this.address?.country) parts.push(this.address.country);
    return parts.join(', ');
});

supplierSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; } });
supplierSchema.set('toObject', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; } });

supplierSchema.plugin(orgScopePlugin);

export default mongoose.model('Supplier', supplierSchema);