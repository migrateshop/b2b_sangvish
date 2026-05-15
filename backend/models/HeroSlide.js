const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
    tag: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    cta1_label: { type: String, required: true, default: 'Get Quotes Now' },
    cta1_link: { type: String, required: true, default: '/rfq/post' },
    cta1_needsAuth: { type: Boolean, default: false },
    cta2_label: { type: String, required: true, default: 'Start Selling' },
    cta2_link: { type: String, required: true, default: '/become-supplier' },
    accent: { type: String, default: '#ff6600' },
    gradFrom: { type: String, default: '#0a1f4e' },
    gradMid: { type: String, default: '#0d2e67' },
    gradTo: { type: String, default: '#14408a' },
    shape1: { type: String, default: '#1a4a9e' },
    shape2: { type: String, default: '#ff6600' },
    statLabel: { type: String, default: '40M+ Products' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    image: { type: String, default: '' }
}, {
    timestamps: true
});

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
