const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rfq_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ' },
    quote_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
    customization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCustomizationRequest' },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    image: { type: String }
});

const orderSchema = new mongoose.Schema({
    buyer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order_items: [orderItemSchema],
    shipping_fee: {
        type: Number,
        default: 0.0
    },
    total_amount: {
        type: Number,
        required: true,
        default: 0.0
    },
    tax_amount: {
        type: Number,
        default: 0.0
    },
    tax_info: {
        name: String,
        tax_type: String, // percentage or fixed
        value: Number,
        country_code: String
    },
    service_fee: {
        type: Number,
        default: 0.0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    payment_status: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded', 'disputed'],
        default: 'unpaid'
    },
    payment_method: {
        type: String,
        default: 'Stripe'
    },
    stripe_session_id: {
        type: String
    },
    paypal_order_id: {
        type: String
    },
    razorpay_order_id: {
        type: String
    },
    razorpay_payment_id: {
        type: String
    },
    payment_provider: {
        type: String,
        default: 'stripe'
    },
    tracking_number: {
        type: String,
        default: ''
    },
    shipping_company: {
        type: String,
        default: ''
    },
    estimated_delivery_date: {
        type: Date
    },
    shipping_address: {
        fullName: String,
        phone: String,
        addressLine: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
