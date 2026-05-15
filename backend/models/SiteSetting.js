const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema({
    primary_color: { type: String, default: '#ff6a00' },
    site_name: { type: String, default: '' },
    seo_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    keywords: { type: String, default: '' },
    pagination_limit: { type: Number, default: 10 },
    // New Fields
    maintenance_mode: { type: Boolean, default: false },
    default_currency: { type: String, default: 'USD' },
    default_language: { type: String, default: 'en' },
    date_format: { type: String, default: 'DD/MM/YYYY' },
    price_format: { type: String, enum: ['prefix', 'suffix'], default: 'prefix' }, // $500 vs 500$
    contact_email: { type: String, default: '' },
    contact_phone: { type: String, default: '' },
    address: { type: String, default: '' },
    ai_api_key: { type: String, default: '' },
    logo_dark: { type: String, default: '' },
    logo_light: { type: String, default: '' },
    favicon: { type: String, default: '' },
    footer_description: { type: String, default: '' },
    google_maps_enabled: { type: Boolean, default: false },
    google_maps_api_key: { type: String, default: '' },
    facebook_url: { type: String, default: '' },
    twitter_url: { type: String, default: '' },
    instagram_url: { type: String, default: '' },
    linkedin_url: { type: String, default: '' },
    youtube_url: { type: String, default: '' },
    app_store_link: { type: String, default: '' },
    google_play_link: { type: String, default: '' },
    enable_recaptcha: { type: Boolean, default: false },
    recaptcha_site_key: { type: String, default: '' },
    recaptcha_secret_key: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('SiteSetting', siteSettingSchema);
