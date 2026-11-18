import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/user.model.js';

const email = process.env.RESET_EMAIL?.trim().toLowerCase();
const newPassword = process.env.RESET_PASSWORD;

if (!email || !newPassword) {
    console.error('Set RESET_EMAIL and RESET_PASSWORD before running.');
    process.exit(1);
}
if (newPassword.length < 8) {
    console.error('Temporary password must be at least 8 characters.');
    process.exit(1);
}

const run = async () => {
    await connectDB();

    // Native driver calls on purpose: bypasses the org-scope plugin and model hooks.
    const user = await User.collection.findOne({ email, role: 'superadmin', isDeleted: { $ne: true } });
    if (!user) throw new Error('No superadmin found with that email.');

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await User.collection.updateOne(
        { _id: user._id },
        { $set: { password: hashed, isActive: true, mustChangePassword: true, passwordChangedAt: new Date() } }
    );

    console.log(`Password reset for ${email}. You will be forced to change it on next login.`);
};

run()
    .then(async () => { await mongoose.disconnect(); process.exit(0); })
    .catch(async (err) => {
        console.error('Reset failed:', err.message);
        await mongoose.disconnect();
        process.exit(1);
    });