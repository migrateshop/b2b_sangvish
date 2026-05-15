const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema({
    min_quantity: { type: Number, required: true },
    max_quantity: { type: Number, default: null }, // null means "+"
    price: { type: Number, required: true },
    discount_percentage: { type: Number, default: 0 }
});

const variantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true }, // e.g. "Color", "Size", "Spec"
    value: { type: String, required: true, trim: true }, // e.g. "Red", "XL", "Waterproof"
    image: { type: String, default: '' },               // Variation specific image
    price_modifier: { type: Number, default: 0 },       // +/- from base price
    stock: { type: Number, default: 0 }
});

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            index: true
        },
        slug: {
            type: String,
            lowercase: true,
            index: true
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true
        },
        category_id: {
            type: String,
            index: true
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
        },
        sku: {
            type: String,
            trim: true,
            index: true
        },
        moq: {
            type: Number,
            default: 1,
            index: true
        },
        currency: {
            type: String,
            default: 'USD'
        },
        price_tiers: [tierSchema],
        variants: [variantSchema],
        key_attributes: [{
            key: { type: String, trim: true },
            value: { type: String, trim: true }
        }],
        main_price: {
            type: Number,
            index: true
        },
        images: [{ type: String }],
        main_image: { type: String },
        video: { type: String, default: '' },
        sample_available: { type: Boolean, default: false },
        sample_price: { type: Number, default: 0 },
        customization_available: { type: Boolean, default: true },
        customization_options: [{ type: String }],
        rating: { type: Number, default: 0, index: true },
        numReviews: { type: Number, default: 0 },
        numOrders: { type: Number, default: 0 },
        countInStock: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['active', 'inactive', 'draft'],
            default: 'draft',
            index: true
        },
        approval_status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true
        },
        approval_note: {
            type: String,
            default: ''
        },
        isFeatured: { type: Boolean, default: false, index: true },
        isPromoted: { type: Boolean, default: false, index: true },
        promotion_expires: { type: Date },
        ppc_bid: { type: Number, default: 0 },
        section: { type: String, default: 'None', index: true },
        oldPrice: { type: Number, default: 0 },
        // Internationalization & Compliance
        hs_code: { type: String, trim: true },
        country_of_origin: { type: String, trim: true },
        weight: { type: Number, default: 0 }, // in kg
        dimensions: {
            length: { type: Number },
            width: { type: Number },
            height: { type: Number }
        },
        // Sales Region Control
        sales_type: {
            type: String,
            enum: ['worldwide', 'specific'],
            default: 'worldwide',
            index: true
        },
        countries: [{
            type: String, // ISO country codes like ["IN", "US", "UK"]
            trim: true
        }],
        // Analytics
        views: { type: Number, default: 0, index: true },
        ranking_score: { type: Number, default: 0, index: true }
    },
    { timestamps: true }
);

// Text search index
productSchema.index({ name: 'text', description: 'text' });

productSchema.pre('save', async function () {
    // Generate slug
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Update main_price to the lowest available tier price for efficient sorting/filtering
    if (this.price_tiers && this.price_tiers.length > 0) {
        this.main_price = Math.min(...this.price_tiers.map(t => t.price));
    }

    // Dynamically calculate ranking_score based on Alibaba-like strategy:
    // Sales (40%), Views (20%), Rating (20%), Reviews (10%), Freshness/Misc (10%)
    // Normalized approx: numOrders * 50, views * 1, rating * 100, numReviews * 20
    this.ranking_score = ((this.numOrders || 0) * 50) + ((this.views || 0) * 1) + ((this.rating || 0) * 100) + ((this.numReviews || 0) * 20);
});

module.exports = mongoose.model('Product', productSchema);
