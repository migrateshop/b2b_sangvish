const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/alibaba_demo/backend/.env' });
const User = require('e:/alibaba_demo/backend/models/User');
const SubscriptionPlan = require('e:/alibaba_demo/backend/models/SubscriptionPlan');

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ role: 'supplier' }).populate('subscription_plan');
        console.log(`Suppliers: ${users.length}`);
        users.forEach(u => {
            console.log(`Email: ${u.email} | Plan: ${u.subscription_plan?.name} | Max Prod: ${u.subscription_plan?.max_products}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
listUsers();
