import Plan from '../../models/plan.model.js'

const PLANS = [
    { name: 'Trial',   slug: 'trial',   userCap: 3,  recordCap: 50,   isDefault: true },
    { name: 'Starter', slug: 'starter', userCap: 5,  recordCap: 500,  isDefault: false },
    { name: 'Growth',  slug: 'growth',  userCap: 15, recordCap: 5000, isDefault: false },
];

export const seedPlans = async () => {
    for (const plan of PLANS) {
        const result = await Plan.findOneAndUpdate(
            { slug: plan.slug },
            { $set: plan },
            { upsert: true, new: true }
        );
        console.log(`  ✅ ${result.name} (${result.slug}) — userCap: ${result.userCap}, recordCap: ${result.recordCap}`);
    }
};