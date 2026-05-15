const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const { decrementProductStock } = require('./productController');

exports.stripeWebhook = async (req, res) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Stripe requires the raw body, which we handle in server.js
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            // Fulfill the orders (could be multiple if multi-supplier checkout)
            try {
                if (session.metadata.type === 'subscription') {
                    const { planId } = session.metadata;
                    const userId = session.client_reference_id;
                    
                    if (userId && planId) {
                        // Import helper or model to activate
                        const User = require('../models/User');
                        const SubscriptionPlan = require('../models/SubscriptionPlan');
                        const user = await User.findById(userId);
                        const plan = await SubscriptionPlan.findById(planId);
                        
                        if (user && plan) {
                            const startDate = new Date();
                            const endDate = new Date();
                            if (plan.duration_type === 'day') endDate.setDate(endDate.getDate() + plan.duration_value);
                            else if (plan.duration_type === 'month') endDate.setMonth(endDate.getMonth() + plan.duration_value);
                            else if (plan.duration_type === 'year') endDate.setFullYear(endDate.getFullYear() + plan.duration_value);

                            user.subscription_plan = plan._id;
                            user.subscription_start = startDate;
                            user.subscription_end = endDate;
                            user.plan_active = true;
                            user.subscription_status = 'active';
                            await user.save({ validateBeforeSave: false });
                        }
                    }
                } else {
                    const orders = await Order.find({ stripe_session_id: session.id });
                    if (orders && orders.length > 0) {
                        for (const order of orders) {
                            if (order.payment_status !== 'paid') {
                                order.payment_status = 'paid';
                                order.status = 'confirmed';
                                await order.save();
                                
                                // Decrement stock
                                if (order.order_items && order.order_items.length > 0) {
                                    await decrementProductStock(order.order_items);
                                }
                                
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error updating orders/subscriptions upon payment webhook:", err);
            }
            break;
        default:
            // Unknown/unhandled webhook event; ignore safely.
    }

    res.json({ received: true });
};
