const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/alibaba_demo/backend/.env' });
const SubscriptionPlan = require('./models/SubscriptionPlan');

async function listPlans() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const plans = await SubscriptionPlan.find({ plan_type: 'supplier' });
        console.log(`Supplier Plans: ${plans.length}`);
        plans.forEach(p => {
            console.log(`Name: ${p.name} | Max Images: ${p.max_images_per_product}`);
        });
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
listPlans();
