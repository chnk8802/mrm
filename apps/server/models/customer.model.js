import { CUSTOMER_TYPE } from '@repo/validators';
import mongoose from 'mongoose';
import { rounded } from '../utils/common/roundedNumber.js';
import { orgScopePlugin } from '../utils/common/orgScope.plugin.js';

const customerSchema = new mongoose.Schema(
  {
  customerType: { type: String, enum: CUSTOMER_TYPE, required: true, },
  name: { type: String, required: [true, 'Customer name is required'], trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
  phone: { type: String, trim: true, maxlength: [20, 'Phone number cannot exceed 20 characters'] },
  email: { type: String, trim: true, lowercase: true, maxlength: [100, 'Email cannot exceed 100 characters'] },
  address: {
    street: { type: String, trim: true, maxlength: [200, 'Street address cannot exceed 200 characters'] },
    city: { type: String, trim: true, maxlength: [100, 'City cannot exceed 100 characters'] },
    state: { type: String, trim: true, maxlength: [100, 'State cannot exceed 100 characters'] },
    postalCode: { type: String, trim: true, maxlength: [20, 'Postal code cannot exceed 20 characters'] },
    country: { type: String, trim: true, maxlength: [100, 'Country cannot exceed 100 characters'], }
  },
  notes: { type: String, maxlength: [1000, 'Notes cannot exceed 1000 characters'] },
  outstandingBalance: rounded({ default: 0 }),
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false, select: false }
}, 
{ timestamps: true, versionKey: false }
);

customerSchema.index({ customerType: 1, isDeleted: 1, isActive: 1 });
customerSchema.index({ name: 'text', email: 'text', phone: 'text' });
customerSchema.index({ createdAt: -1 });

customerSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address?.street) parts.push(this.address.street);
  if (this.address?.city) parts.push(this.address.city);
  if (this.address?.state) parts.push(this.address.state);
  if (this.address?.postalCode) parts.push(this.address.postalCode);
  if (this.address?.country) parts.push(this.address.country);
  return parts.join(', ');
});

customerSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; }});
customerSchema.set('toObject', { virtuals: true, transform: (doc, ret) => { delete ret.id; return ret; }});

customerSchema.plugin(orgScopePlugin, {countsTowardsCap: true});

export default mongoose.model('Customer', customerSchema);
