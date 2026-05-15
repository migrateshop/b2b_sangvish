const mongoose = require('mongoose');

/**
 * Quotation Schema
 * Represents a supplier's response to an RFQ.
 */
const quoteSchema = new mongoose.Schema(
    {
        rfq: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RFQ',
            required: [true, 'RFQ reference is required'],
            index: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Supplier reference is required'],
            index: true,
        },
        price_offered: {
            type: Number,
            required: [true, 'Price is required'],
        },
        currency: {
            type: String,
            default: 'USD',
        },
        valid_until: {
            type: Date,
            required: [true, 'Validity date is required'],
        },
        note: {
            type: String,
            trim: true,
            maxlength: [1000, 'Note cannot exceed 1000 characters'],
        },
        estimated_delivery_days: {
            type: Number,
            min: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'negotiating', 'paid'],
            default: 'pending',
        },
        attachments: [
            {
                type: String, // Catalogs, specs, etc.
            },
        ],
        negotiation_history: [
            {
                price: Number,
                note: String,
                offered_by: { type: String, enum: ['buyer', 'supplier'] },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        last_offered_by: { type: String, enum: ['buyer', 'supplier'], default: 'supplier' }
    },
    {
        timestamps: true,
    }
);

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;
