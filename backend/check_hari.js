const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/alibaba_demo/backend/.env' });
const User = require('e:/alibaba_demo/backend/models/User');
const Product = require('e:/alibaba_demo/backend/models/Product');
const SubscriptionPlan = require('e:/alibaba_demo/backend/models/SubscriptionPlan');

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'harinibuyer@yopmail.com' }).populate('subscription_plan');
        if (!user) {
            console.log('User not found');
            process.exit(0);
        }
        const prodCount = await Product.countDocuments({ supplier: user._id });
        console.log(`Email: ${user.email}`);
        console.log(`Plan: ${user.subscription_plan?.name}`);
        console.log(`Max Products: ${user.subscription_plan?.max_products}`);
        console.log(`Current Products: ${prodCount}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
listUsers();
