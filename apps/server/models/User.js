import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'manager', 'staff'],
        default: 'superadmin'
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: "https://i.pravatar.cc"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        select: false
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for performance optimization
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ name: 'text', email: 'text', phone: 'text' });
userSchema.index({ createdAt: -1 });

userSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => {
  delete ret.id;
  return ret;
}});
userSchema.set('toObject', { virtuals: true, transform: (doc, ret) => {
  delete ret.id;
  return ret;
}});

export default mongoose.model('User', userSchema);