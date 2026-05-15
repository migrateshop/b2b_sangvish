const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: 'e:/alibaba_demo/backend/.env', override: true });

const Order = require('e:/alibaba_demo/backend/models/Order');

async function clearPendingOrders() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        const result = await Order.deleteMany({ status: 'pending' });
        console.log(`Successfully deleted ${result.deletedCount} pending orders.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

clearPendingOrders();
