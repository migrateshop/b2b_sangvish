const mongoose = require('mongoose');

/**
 * RFQ (Request for Quotation) Schema
 * Essential B2B feature allowing buyers to request Custom quotes from suppliers.
 */
const rfqSchema = new mongoose.Schema(
    {
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Buyer reference is required'],
            index: true,
        },
        title: {
            type: String,
            required: [true, 'RFQ title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
            index: true,
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
        },
        unit: {
            type: String,
            required: [true, 'Unit of measure is required'],
            default: 'pieces',
        },
        target_price: {
            type: Number,
            min: [0, 'Price cannot be negative'],
        },
        currency: {
            type: String,
            default: 'USD',
        },
        shipping_details: {
            type: String,
            trim: true,
        },
        expiry_date: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        attachments: [
            {
                type: String, // URLs or paths to uploaded files/images
            },
        ],
        status: {
            type: String,
            enum: ['pending', 'active', 'closed', 'expired'],
            default: 'active',
            index: true,
        },
        is_verified: {
            type: Boolean,
            default: false,
        },
        isPromoted: {
            type: Boolean,
            default: false
        },
        promotion_expires: {
            type: Date
        }
    },
    {
        timestamps: true,
    }
);

// Virtual for checking if RFQ has expired
rfqSchema.virtual('isExpired').get(function () {
    return this.expiry_date < new Date();
});

const RFQ = mongoose.model('RFQ', rfqSchema);

module.exports = RFQ;
