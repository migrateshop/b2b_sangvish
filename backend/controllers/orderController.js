const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const Razorpay = require('razorpay');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Quote = require('../models/Quote');
const RFQ = require('../models/RFQ');
const TaxRule = require('../models/TaxRule');
const ShippingRule = require('../models/ShippingRule');
const CommissionRule = require('../models/CommissionRule');
const riskService = require('../services/riskService');
const { decrementProductStock } = require('./productController');
const { addJob } = require('../services/queueService');
const OrderStatusLog = require('../models/OrderStatusLog');

const createOrderStatusLog = async (orderId, status, message = '') => {
    try {
        await OrderStatusLog.create({
            order_id: orderId,
            status: status,
            message: message
        });
    } catch (err) {
        console.error('Error creating order status log:', err);
    }
};

const getShippingFeeForOrder = async (countryCode, items = []) => {
    try {
        const rule = await ShippingRule.findOne({ country_code: countryCode.toUpperCase(), is_active: true });
        if (!rule) return 50; // Default flat fee if no rule

        let totalWeight = 0;
        for (const item of items) {
            const product = await Product.findById(item.productId || item.product_id);
            if (product && product.weight) {
                totalWeight += product.weight * (item.quantity || 1);
            }
        }

        return rule.base_cost + (totalWeight * rule.cost_per_kg);
    } catch (err) {
        return 50;
    }
};

// Internal helper for tax calculation
const getTaxAmountForOrder = async (countryCode, amount, items = []) => {
    let totalTax = 0;
    let taxBreakdown = [];

    // Check for product-specific or category-specific taxes first if items are provided
    for (const item of items) {
        let itemRule = await TaxRule.findOne({ country_code: countryCode, scope: 'product', product_ids: item.productId || item.product_id, is_active: true });

        if (!itemRule) {
            // Need to fetch product for category_id if not in item
            const product = await Product.findById(item.productId || item.product_id);
            if (product) {
                itemRule = await TaxRule.findOne({ country_code: countryCode, scope: 'category', category_ids: product.category, is_active: true });
            }
        }

        if (itemRule) {
            const itemAmount = (item.price || 0) * (item.quantity || 1);
            const tax = itemRule.type === 'percentage' ? (itemAmount * itemRule.value) / 100 : itemRule.value;
            totalTax += tax;
            taxBreakdown.push({ name: itemRule.name, amount: tax, rule: itemRule });
        }
    }

    // If no item-specific taxes were applied, check for global country tax
    if (totalTax === 0) {
        const globalRule = await TaxRule.findOne({ country_code: countryCode, scope: 'global', is_active: true });
        if (globalRule) {
            totalTax = globalRule.type === 'percentage' ? (amount * globalRule.value) / 100 : globalRule.value;
            taxBreakdown.push({ name: globalRule.name, amount: totalTax, rule: globalRule });
        }
    }

    return { totalTax: parseFloat(totalTax.toFixed(2)), primaryRule: taxBreakdown[0]?.rule || null };
};

// @desc    Checkout for an accepted RFQ quote
// @route   POST /api/orders/checkout-quote/:quoteId
// @access  Private
exports.checkoutQuote = async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.quoteId).populate('rfq').populate('supplier');
        if (!quote) return res.status(404).json({ message: 'Quote not found' });

        if (quote.status !== 'accepted') {
            return res.status(400).json({ message: 'Only accepted quotes can be paid for' });
        }

        if (quote.rfq.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const itemSubtotal = quote.price_offered * (quote.rfq.quantity || 1);
        
        // Dynamic Commission
        let commRule = await CommissionRule.findOne({ is_active: true }); // Fallback to first active rule
        let serviceFee = parseFloat((itemSubtotal * 0.03).toFixed(2)); // Default fallback
        if (commRule) {
            serviceFee = commRule.type === 'Percentage' ? (itemSubtotal * commRule.value) / 100 : commRule.value;
        }

        const buyerCountry = req.user.country_code || 'US';
        const currencyCode = (quote.currency || 'USD').toLowerCase();
        const { totalTax, primaryRule } = await getTaxAmountForOrder(buyerCountry, itemSubtotal, [{ product_id: quote.rfq.product_id, price: quote.price_offered, quantity: quote.rfq.quantity }]);

        const lineItems = [{
            price_data: {
                currency: currencyCode,
                product_data: {
                    name: `RFQ Order: ${quote.rfq.title}`,
                    description: `Custom quote fulfillment for RFQ #${quote.rfq._id}`
                },
                unit_amount: Math.round(quote.price_offered * 100),
            },
            quantity: quote.rfq.quantity,
        }];

        if (serviceFee > 0) {
            lineItems.push({
                price_data: {
                    currency: currencyCode,
                    product_data: { name: 'Platform Service Fee' },
                    unit_amount: Math.round(serviceFee * 100),
                },
                quantity: 1,
            });
        }

        if (totalTax > 0) {
            lineItems.push({
                price_data: {
                    currency: currencyCode,
                    product_data: {
                        name: primaryRule ? `Tax (${primaryRule.name})` : 'Tax',
                    },
                    unit_amount: Math.round(totalTax * 100),
                },
                quantity: 1,
            });
        }

        const FRONTEND_URL = process.env.FRONTEND_URL || '';
        const { paymentMethod } = req.body;
        const targetMethod = paymentMethod || 'stripe';
        const PaymentSetting = require('../models/PaymentSetting');
        const settings = await PaymentSetting.findOne({ provider: targetMethod, enable: true });

        if (!settings && targetMethod !== 'stripe') {
            return res.status(400).json({ message: `${targetMethod} payment is not enabled` });
        }

        let responseData = {};

        if (targetMethod === 'stripe') {
            const stripeInstance = require('stripe')(settings?.secret_key || process.env.STRIPE_SECRET_KEY);
            const session = await stripeInstance.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&status=success`,
                cancel_url: `${FRONTEND_URL}/dashboard?status=cancel`,
                client_reference_id: req.user._id.toString(),
                metadata: {
                    quoteId: quote._id.toString(),
                    rfqId: quote.rfq._id.toString()
                }
            });
            responseData = { id: session.id, url: session.url };
        } else if (targetMethod === 'paypal') {
            const clientId = settings.public_key;
            const clientSecret = settings.secret_key;
            const environment = settings.live_mode 
                ? new paypal.core.LiveEnvironment(clientId, clientSecret)
                : new paypal.core.SandboxEnvironment(clientId, clientSecret);
            const client = new paypal.core.PayPalHttpClient(environment);

            const request = new paypal.orders.OrdersCreateRequest();
            request.prefer("return=representation");
            request.requestBody({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: (itemSubtotal + totalTax + serviceFee).toFixed(2)
                    },
                    description: `RFQ Order: ${quote.rfq.title}`
                }],
                application_context: {
                    return_url: `${FRONTEND_URL}/dashboard?status=success`,
                    cancel_url: `${FRONTEND_URL}/dashboard?status=cancel`
                }
            });

            const order = await client.execute(request);
            const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
            responseData = { id: order.result.id, url: approvalUrl };
        } else if (targetMethod === 'razorpay') {
            const instance = new Razorpay({
                key_id: settings.public_key,
                key_secret: settings.secret_key,
            });

            const options = {
                amount: Math.round((itemSubtotal + totalTax + serviceFee) * 100),
                currency: "INR",
                receipt: `quote_${quote._id}_${Date.now()}`,
            };

            const rzpOrder = await instance.orders.create(options);
            responseData = { 
                id: rzpOrder.id, 
                amount: rzpOrder.amount, 
                currency: rzpOrder.currency,
                key: settings.public_key 
            };
        }

        // Create the order
        const newOrder = await Order.create({
            buyer_id: req.user._id,
            supplier_id: quote.supplier._id,
            shipping_address: req.body.shippingAddress,
            order_items: [{
                rfq_id: quote.rfq._id,
                quote_id: quote._id,
                name: quote.rfq.title,
                quantity: quote.rfq.quantity,
                price: quote.price_offered,
            }],
            tax_amount: totalTax,
            tax_info: primaryRule ? {
                name: primaryRule.name,
                tax_type: primaryRule.type,
                value: primaryRule.value,
                country_code: primaryRule.country_code
            } : null,
            service_fee: serviceFee,
            total_amount: itemSubtotal + totalTax + serviceFee,
            stripe_session_id: targetMethod === 'stripe' ? responseData.id : null,
            paypal_order_id: targetMethod === 'paypal' ? responseData.id : null,
            razorpay_order_id: targetMethod === 'razorpay' ? responseData.id : null,
            payment_provider: targetMethod,
            status: 'pending',
            payment_status: 'unpaid'
        });

        // Initialize Timeline
        await createOrderStatusLog(newOrder._id, 'Order Placed', 'Order created and awaiting payment');

        res.json(responseData);
    } catch (err) {
        console.error('Quote checkout error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Create Stripe checkout session
// @route   POST /api/orders/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
    try {
        const { items, shippingFee, countryCode, paymentMethod } = req.body;
        const targetMethod = paymentMethod || 'stripe';
        const PaymentSetting = require('../models/PaymentSetting');
        const settings = await PaymentSetting.findOne({ provider: targetMethod, enable: true });

        if (!settings && targetMethod !== 'stripe') {
            return res.status(400).json({ message: `${targetMethod} payment is not enabled` });
        }

        const buyerCountry = countryCode || req.user.country_code || 'US';
        const dynamicShippingFee = shippingFee !== undefined ? shippingFee : await getShippingFeeForOrder(buyerCountry, items || []);

        let normalizedItems = items;
        if (!items && req.body.productId) {
            normalizedItems = [{
                productId: req.body.productId,
                quantity: req.body.quantity,
                variantOptions: req.body.variantOptions,
                customizationId: req.body.customizationId
            }];
        }

        if (!normalizedItems || normalizedItems.length === 0) {
            return res.status(400).json({ message: 'No items in cart' });
        }

        const lineItems = [];
        const supplierOrders = {}; // Group by supplierId
        let totalCartAmount = 0;

        for (const item of normalizedItems) {
            const product = await Product.findById(item.productId).populate('supplier');
            if (!product) continue;

            // Calculate price based on tiers/variants
            let price = product.main_price;

            // If it's a customization order, use the price passed from frontend (which is the quoted price)
            if (item.customizationId) {
                price = item.price;
            } else {
                if (product.price_tiers?.length > 0) {
                    const sortedTiers = [...product.price_tiers].sort((a, b) => a.min_quantity - b.min_quantity);
                    for (const tier of sortedTiers) {
                        if (item.quantity >= tier.min_quantity) price = tier.price;
                    }
                }
                if (item.variantOptions) {
                    Object.entries(item.variantOptions).forEach(([vName, vVal]) => {
                        const v = product.variants?.find(x => x.name === vName && x.value === vVal);
                        if (v?.price_modifier) price += v.price_modifier;
                    });
                }
            }

            const itemSubtotal = price * item.quantity;
            totalCartAmount += itemSubtotal;

            const productData = { name: product.name };
            const variantValues = item.variantOptions ? Object.values(item.variantOptions) : [];
            if (variantValues.length > 0) {
                productData.description = `Variants: ${variantValues.join(', ')}`;
            }

            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: productData,
                    unit_amount: Math.round(price * 100),
                },
                quantity: item.quantity,
            });

            // Group for order creation
            const supplier = product.supplier;
            const sId = supplier?._id?.toString() || 'unknown_supplier';
            if (!supplierOrders[sId]) {
                supplierOrders[sId] = {
                    supplier: sId === 'unknown_supplier' ? null : sId,
                    items: [],
                    subtotal: 0
                };
            }
            supplierOrders[sId].items.push({
                product_id: product._id,
                name: product.name,
                quantity: item.quantity,
                price: price,
                image: product.images?.[0] || product.main_image || '',
                customization_id: item.customizationId
            });
            supplierOrders[sId].subtotal += itemSubtotal;
        }

        // Calculate Tax and Fees for the entire cart
        const { totalTax, primaryRule } = await getTaxAmountForOrder(buyerCountry, totalCartAmount, normalizedItems);
        
        // Dynamic Commission calculation
        let totalServiceFee = 0;
        const mainCommRule = await CommissionRule.findOne({ appliesTo: 'All Products', is_active: true });
        if (mainCommRule) {
            totalServiceFee = mainCommRule.type === 'Percentage' ? (totalCartAmount * mainCommRule.value) / 100 : mainCommRule.value;
        } else {
            totalServiceFee = parseFloat((totalCartAmount * 0.03).toFixed(2)); // Original fallback
        }

        if (totalServiceFee > 0) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Platform Service Fee' },
                    unit_amount: Math.round(totalServiceFee * 100),
                },
                quantity: 1,
            });
        }

        if (totalTax > 0) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: primaryRule ? `Tax (${primaryRule.name})` : 'Tax',
                    },
                    unit_amount: Math.round(totalTax * 100),
                },
                quantity: 1,
            });
        }

        if (dynamicShippingFee > 0) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Shipping & Logistics' },
                    unit_amount: Math.round(dynamicShippingFee * 100),
                },
                quantity: 1,
            });
        }

        const FRONTEND_URL = process.env.FRONTEND_URL || '';

        let responseData = {};

        if (targetMethod === 'stripe') {
            const stripeInstance = require('stripe')(settings?.secret_key || process.env.STRIPE_SECRET_KEY);
            const session = await stripeInstance.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&status=success`,
                cancel_url: `${FRONTEND_URL}/cart?status=cancel`,
                client_reference_id: req.user._id.toString(),
                metadata: {
                    buyerCountry
                }
            });
            responseData = { id: session.id, url: session.url };
        } else if (targetMethod === 'paypal') {
            const clientId = settings.public_key;
            const clientSecret = settings.secret_key;
            const environment = settings.live_mode 
                ? new paypal.core.LiveEnvironment(clientId, clientSecret)
                : new paypal.core.SandboxEnvironment(clientId, clientSecret);
            const client = new paypal.core.PayPalHttpClient(environment);

            const request = new paypal.orders.OrdersCreateRequest();
            request.prefer("return=representation");
            request.requestBody({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: (totalCartAmount + totalTax + dynamicShippingFee + totalServiceFee).toFixed(2)
                    }
                }],
                application_context: {
                    return_url: `${FRONTEND_URL}/dashboard?status=success`,
                    cancel_url: `${FRONTEND_URL}/cart?status=cancel`
                }
            });

            const order = await client.execute(request);
            const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
            responseData = { id: order.result.id, url: approvalUrl };
        } else if (targetMethod === 'razorpay') {
            const instance = new Razorpay({
                key_id: settings.public_key,
                key_secret: settings.secret_key,
            });

            const options = {
                amount: Math.round((totalCartAmount + totalTax + dynamicShippingFee + totalServiceFee) * 100), // in paise
                currency: "INR", // Razorpay usually requires INR for domestic or converts
                receipt: `rcpt_${Date.now()}`,
            };

            const rzpOrder = await instance.orders.create(options);
            responseData = { 
                id: rzpOrder.id, 
                amount: rzpOrder.amount, 
                currency: rzpOrder.currency,
                key: settings.public_key 
            };
        } else {
            responseData = { success: true, message: 'Order created, manual payment required' };
        }

        // 🛡️ Log high value transaction for fraud detection (Admin review)
        if (totalCartAmount > 10000) {
            await riskService.logRisk(req.user._id, 'high_value_transaction', 'high', `Order exceeding $10,000 detected (Total: $${totalCartAmount})`, { id: responseData?.id || 'manual' });
        }

        // Create Order records for each supplier
        const orderIds = [];
        const supplierEntries = Object.entries(supplierOrders);
        for (let i = 0; i < supplierEntries.length; i++) {
            const [sId, data] = supplierEntries[i];

            // Distribute tax and fees proportionally or just apply to the first order for simplicity in MVP
            const orderTax = i === 0 ? totalTax : 0;
            const orderShipping = i === 0 ? dynamicShippingFee : 0;
            const orderServiceFee = i === 0 ? totalServiceFee : 0;

            const ord = await Order.create({
                buyer_id: req.user._id,
                supplier_id: sId === 'unknown_supplier' ? null : sId,
                shipping_address: req.body.shippingAddress,
                order_items: data.items,
                tax_amount: orderTax,
                tax_info: i === 0 && primaryRule ? {
                    name: primaryRule.name,
                    tax_type: primaryRule.type,
                    value: primaryRule.value,
                    country_code: primaryRule.country_code
                } : null,
                service_fee: orderServiceFee,
                total_amount: data.subtotal + orderTax + orderShipping + orderServiceFee,
                stripe_session_id: targetMethod === 'stripe' ? responseData.id : null,
                paypal_order_id: targetMethod === 'paypal' ? responseData.id : null,
                razorpay_order_id: targetMethod === 'razorpay' ? responseData.id : null,
                payment_provider: targetMethod,
                status: 'pending',
                payment_status: 'unpaid'
            });
            
            // Initialize Timeline
            await createOrderStatusLog(ord._id, 'Order Placed', 'Order created and awaiting payment');
            
            orderIds.push(ord._id);
        }

        res.json({ ...responseData, order_ids: orderIds });

    } catch (err) {
        console.error('Checkout error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('buyer_id', 'first_name last_name email profile_image')
            .populate('supplier_id', 'first_name last_name company_name business_type email');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check auth: Buyer, Supplier or Admin
        const isBuyer = order.buyer_id?._id?.toString() === req.user._id.toString();
        const isSupplier = order.supplier_id?._id?.toString() === req.user._id.toString();
        const isAdmin = (req.user.roles?.includes('admin') || req.user.role === 'admin');

        if (!isBuyer && !isSupplier && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        // Fetch Timeline Logs
        const timeline = await OrderStatusLog.find({ order_id: order._id }).sort({ createdAt: 1 });

        res.json({
            ...order._doc,
            timeline: timeline || []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ buyer_id: req.user._id })
            .populate('supplier_id', 'first_name last_name company_name')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify Stripe session and update status
// @route   POST /api/orders/verify-session
// @access  Private
exports.verifySession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const orders = await Order.find({ stripe_session_id: sessionId }).populate('buyer_id', 'first_name last_name');
            if (orders.length > 0) {
                for (let order of orders) {
                    if (order.payment_status !== 'paid') {
                        order.payment_status = 'paid';
                        order.status = 'confirmed';
                        await order.save();
                        await createOrderStatusLog(order._id, 'Payment Confirmed', 'Payment verified successfully via Stripe');
                        await completePaymentPostTasks(order, req.io);
                    }
                }
                return res.json({ success: true, message: 'Orders updated to paid.' });
            }
        }
        res.status(400).json({ message: 'Payment not verified' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get supplier orders
// @route   GET /api/orders/supplier-orders
// @access  Private/Supplier
exports.getSupplierOrders = async (req, res) => {
    try {
        const orders = await Order.find({ supplier_id: req.user._id })
            .populate('buyer_id', 'first_name last_name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status (Supplier/Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/(Supplier or Admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, tracking_number, shipping_company, estimated_delivery_date } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check auth
        if (order.supplier_id.toString() !== req.user._id.toString() && !(req.user.roles?.includes('admin') || req.user.role === 'admin')) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        if (status && status !== order.status) {
            const oldStatus = order.status;
            order.status = status;
            await createOrderStatusLog(order._id, status.charAt(0).toUpperCase() + status.slice(1), `Order status updated from ${oldStatus} to ${status}`);
        }
        if (status === 'cancelled') {
            const { sendNotification } = require('../services/notificationService');
            await sendNotification(
                req.io,
                order.buyer_id, // Notify buyer if supplier/admin cancelled
                'Order Cancelled',
                `Order #${order._id} was cancelled.`,
                'order',
                `/dashboard/orders/${order._id}`
            );

            // 📧 Send email (Queued Template)
            const { enqueueTemplatedMail } = require('../services/mailService');
            const User = require('../models/User');
            const buyer = await User.findById(order.buyer_id);
            if (buyer && buyer.email) {
                enqueueTemplatedMail('order-cancelled', buyer.email, {
                    first_name: buyer.first_name,
                    order_id: order._id,
                    order_url: `${process.env.FRONTEND_URL}/dashboard/orders/${order._id}`
                }).catch(e => console.error('Order cancelled email error:', e));
            }
        }

        if (status === 'shipped') {
            // 📧 Send email (Queued Template)
            const { enqueueTemplatedMail } = require('../services/mailService');
            const User = require('../models/User');
            const buyer = await User.findById(order.buyer_id);
            if (buyer && buyer.email) {
                enqueueTemplatedMail('order-shipped', buyer.email, {
                    first_name: buyer.first_name,
                    order_id: order._id,
                    tracking_number: tracking_number || 'N/A',
                    shipping_company: shipping_company || 'Standard Shipping',
                    order_url: `${process.env.FRONTEND_URL}/dashboard/orders/${order._id}`
                }).catch(e => console.error('Order shipped email error:', e));
            }
        }

        if (tracking_number !== undefined) order.tracking_number = tracking_number;
        if (shipping_company !== undefined) order.shipping_company = shipping_company;
        if (estimated_delivery_date !== undefined) order.estimated_delivery_date = estimated_delivery_date;

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrdersAdmin = async (req, res) => {
    try {
        if (!(req.user.roles?.includes('admin') || req.user.role === 'admin')) {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        const orders = await Order.find({})
            .populate('buyer_id', 'first_name last_name email')
            .populate('supplier_id', 'first_name last_name company_name')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete order (Admin)
// @route   DELETE /api/orders/admin/:id
// @access  Private/Admin
exports.deleteOrderAdmin = async (req, res) => {
    try {
        if (!(req.user.roles?.includes('admin') || req.user.role === 'admin')) {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Clear all pending orders (Admin)
// @route   DELETE /api/orders/admin/clear-pending
// @access  Private/Admin
exports.clearPendingOrdersAdmin = async (req, res) => {
    try {
        if (!(req.user.roles?.includes('admin') || req.user.role === 'admin')) {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        const result = await Order.deleteMany({ status: 'pending' });
        res.json({ message: `Cleared ${result.deletedCount} pending orders` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Buyer confirms delivery
// @route   PUT /api/orders/:id/confirm-delivery
// @access  Private/Buyer
exports.confirmDelivery = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.buyer_id.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });
        if (!['shipped', 'confirmed'].includes(order.status))
            return res.status(400).json({ message: 'Order must be shipped or confirmed to mark as delivered' });

        order.status = 'delivered';
        await order.save();
        await createOrderStatusLog(order._id, 'Delivered', 'Order delivery confirmed by buyer');
        res.json({ message: 'Delivery confirmed', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/orders/verify-razorpay
// @access  Private
// @desc    Verify Razorpay Payment
// @route   POST /api/orders/verify-razorpay
// @access  Private
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const crypto = require('crypto');
        const PaymentSetting = require('../models/PaymentSetting');
        const settings = await PaymentSetting.findOne({ provider: 'razorpay' });

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", settings.secret_key)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            const orders = await Order.find({ razorpay_order_id }).populate('buyer_id', 'first_name last_name');
            for (let order of orders) {
                if (order.payment_status !== 'paid') {
                    order.payment_status = 'paid';
                    order.status = 'confirmed';
                    order.razorpay_payment_id = razorpay_payment_id;
                    await order.save();
                    await createOrderStatusLog(order._id, 'Payment Confirmed', 'Payment verified successfully via Razorpay');
                    await completePaymentPostTasks(order, req.io);
                }
            }
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Verify PayPal payment and update status
// @route   POST /api/orders/verify-paypal
// @access  Private
exports.verifyPayPalPayment = async (req, res) => {
    try {
        const { orderId } = req.body; 
        const PaymentSetting = require('../models/PaymentSetting');
        const settings = await PaymentSetting.findOne({ provider: 'paypal' });

        if (!settings || !settings.enable) return res.status(400).json({ message: 'PayPal not enabled' });

        const environment = settings.live_mode
            ? new paypal.core.LiveEnvironment(settings.public_key, settings.secret_key)
            : new paypal.core.SandboxEnvironment(settings.public_key, settings.secret_key);
        const client = new paypal.core.PayPalHttpClient(environment);

        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        const capture = await client.execute(request);

        if (capture.result.status === 'COMPLETED') {
            const orders = await Order.find({ paypal_order_id: orderId }).populate('buyer_id', 'first_name last_name');
            for (let order of orders) {
                if (order.payment_status !== 'paid') {
                    order.payment_status = 'paid';
                    order.status = 'confirmed';
                    await order.save();
                    await createOrderStatusLog(order._id, 'Payment Confirmed', 'Payment verified successfully via PayPal');
                    await completePaymentPostTasks(order, req.io);
                }
            }
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Payment not completed' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Helper for post-payment tasks
async function completePaymentPostTasks(order, io) {
    // 1. Decrement Stock
    await decrementProductStock(order.order_items);

    // 2. Credit Supplier Wallet
    const Transaction = require('../models/Transaction');
    const User = require('../models/User');
    const supplier = await User.findById(order.supplier_id);
    if (supplier) {
        const creditAmount = order.total_amount - (order.service_fee || 0);
        supplier.wallet_balance = (supplier.wallet_balance || 0) + creditAmount;
        await supplier.save({ validateBeforeSave: false });

        await Transaction.create({
            user_id: supplier._id,
            order_id: order._id,
            type: 'payment',
            amount: creditAmount,
            status: 'completed',
            description: `Order payment for Order #${order._id}`
        });
    }

    // 5. Update Quote status if applicable
    if (order.order_items && order.order_items.length > 0) {
        const Quote = require('../models/Quote');
        const RFQ = require('../models/RFQ');
        for (const item of order.order_items) {
            if (item.quote_id) {
                await Quote.findByIdAndUpdate(item.quote_id, { status: 'paid' });
                if (item.rfq_id) {
                    await RFQ.findByIdAndUpdate(item.rfq_id, { status: 'closed' });
                }
            }
            if (item.customization_id) {
                const ProductCustomizationRequest = require('../models/ProductCustomizationRequest');
                await ProductCustomizationRequest.findByIdAndUpdate(item.customization_id, { status: 'completed' });
            }
        }
    }

    // 3. Notify Supplier
    const { sendNotification } = require('../services/notificationService');
    await sendNotification(
        io,
        order.supplier_id,
        'Order Booked',
        `${order.buyer_id.first_name} ${order.buyer_id.last_name} booked the product(s). Your wallet has been credited.`,
        'order',
        `/dashboard/orders/${order._id}`
    );

    // 4. Send Email (Queued Template)
    try {
        const { enqueueTemplatedMail } = require('../services/mailService');
        const buyer = await User.findById(order.buyer_id);
        if (buyer && buyer.email) {
            enqueueTemplatedMail('order-confirmation', buyer.email, {
                first_name: buyer.first_name,
                order_id: order._id,
                total_currency: '$', // Adjust if dynamic currency is used
                total_amount: order.total_amount,
                order_url: `${process.env.FRONTEND_URL}/dashboard/orders/${order._id}`
            }).catch(e => console.error('Order confirmation templated email error:', e));
        }
    } catch (e) {
        console.error('Email notify error:', e);
    }
}
