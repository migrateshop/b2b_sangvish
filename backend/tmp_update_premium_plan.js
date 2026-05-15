const mongoose = require('mongoose');
require('dotenv').config();
const SubscriptionPlan = require('./models/SubscriptionPlan');

async function updatePremiumPlan() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const premiumPlan = await SubscriptionPlan.findOne({ name: 'Premium' });
        if (premiumPlan) {
            premiumPlan.max_products = -1; // Unlimited
            premiumPlan.max_showcases = 50;
            premiumPlan.max_rfq_responses = 100;
            premiumPlan.has_analytics = true;
            premiumPlan.badge_color = '#ff6a00'; // Brand orange
            await premiumPlan.save();
            console.log('Premium plan updated successfully');
        } else {
            console.log('Premium plan not found');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updatePremiumPlan();
