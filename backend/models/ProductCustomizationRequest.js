const mongoose = require('mongoose');

const productCustomizationRequestSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    buyer_name: {
        type: String,
        required: true
    },
    buyer_email: {
        type: String,
        required: true
    },
    buyer_phone: {
        type: String,
        required: true
    },
    customization_type: {
        type: String,
        enum: ['Logo', 'Packaging', 'Color', 'Size', 'Material/Fabric Change', 'Other'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    customization_details: {
        type: String,
        required: true
    },
    reference_file: {
        type: String // File name / upload path
    },
    expected_delivery_date: {
        type: Date,
        required: true
    },
    budget_range: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'quoted', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    supplier_note: {
        type: String
    },
    quotation_price: {
        type: Number
    },
    quotation_file: {
        type: String
    },
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ProductCustomizationRequest', productCustomizationRequestSchema);
