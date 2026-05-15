const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Order = require('./models/Order');
const Product = require('./models/Product');
const RFQ = require('./models/RFQ');
const User = require('./models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        console.log('--- Current Month Stats ---');
        console.log('Today:', now);
        console.log('First day of month:', firstDayOfMonth);
        
        const orders = await Order.find({ payment_status: 'paid' });
        console.log('Total Paid Orders:', orders.length);
        
        const thisMonthOrders = await Order.find({ 
            payment_status: 'paid', 
            createdAt: { $gte: firstDayOfMonth } 
        });
        console.log('This Month Paid Orders:', thisMonthOrders.length);
        
        const totalFees = orders.reduce((sum, o) => sum + (o.service_fee || 0), 0);
        const thisMonthFees = thisMonthOrders.reduce((sum, o) => sum + (o.service_fee || 0), 0);
        
        console.log('Total transaction fees:', totalFees);
        console.log('This month transaction fees:', thisMonthFees);
        
        const boostedRFQs = await RFQ.countDocuments({ isPromoted: true });
        const promotedProducts = await Product.find({ isPromoted: true });
        const adRevenue = (boostedRFQs * 10) + promotedProducts.reduce((sum, p) => sum + (p.ppc_bid || 0) * 100, 0);
        console.log('Total Ad Revenue:', adRevenue);

        const subscriptionStats = await User.aggregate([
            { $match: { subscription_plan: { $ne: null } } },
            {
                $lookup: {
                    from: 'subscriptionplans',
                    localField: 'subscription_plan',
                    foreignField: '_id',
                    as: 'plan'
                }
            },
            { $unwind: '$plan' },
            { $group: { _id: null, total: { $sum: '$plan.price' } } }
        ]);
        const subscriptionRevenue = subscriptionStats[0]?.total || 0;
        console.log('Total Subscription Revenue:', subscriptionRevenue);
        
        const currentMonthNet = thisMonthFees + (adRevenue / 6) + (subscriptionRevenue / 12); 
        console.log('Calculated Current Month Net:', currentMonthNet);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
