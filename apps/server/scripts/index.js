import connectDB from '../config/db.js';
import mongoose from 'mongoose';
import { seedPlans } from './seed/seedPlans.js';

const seeders = [
    { name: 'Plans', run: seedPlans },
];

const runSeeders = async () => {
    await connectDB();

    for (const { name, run } of seeders) {
        console.log(`\nSeeding ${name}...`);
        await run();
    }

    console.log('\nAll seeds complete.');
    await mongoose.disconnect();
    process.exit(0);
};

runSeeders().catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});