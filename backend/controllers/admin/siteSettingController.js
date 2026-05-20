const SiteSetting = require('../../models/SiteSetting');

const mongoose = require('mongoose');

// GET site settings (public — no auth needed for color fetch)
const getSiteSettings = async (req, res) => {
    try {
        let settings = await SiteSetting.findOne();
        if (!settings) settings = await SiteSetting.create({});
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE site settings (admin only)
const updateSiteSettings = async (req, res) => {
    try {
        const { 
            primary_color, site_name, seo_title, meta_description, keywords, pagination_limit,
            maintenance_mode, default_currency, default_language, date_format, price_format,
            contact_email, contact_phone, address, ai_api_key,
            logo_dark, logo_light, favicon, footer_description,
            google_maps_enabled, google_maps_api_key
        } = req.body;
        
        let settings = await SiteSetting.findOne();
        if (!settings) settings = new SiteSetting();
        
        if (primary_color !== undefined) settings.primary_color = primary_color;
        if (site_name !== undefined) settings.site_name = site_name;
        if (seo_title !== undefined) settings.seo_title = seo_title;
        if (meta_description !== undefined) settings.meta_description = meta_description;
        if (keywords !== undefined) settings.keywords = keywords;
        if (pagination_limit !== undefined) settings.pagination_limit = Number(pagination_limit);
        
        if (maintenance_mode !== undefined) settings.maintenance_mode = !!maintenance_mode;
        if (req.body.enable_cron_reset !== undefined) settings.enable_cron_reset = !!req.body.enable_cron_reset;
        if (default_currency !== undefined) settings.default_currency = default_currency;
        if (default_language !== undefined) settings.default_language = default_language;
        if (date_format !== undefined) settings.date_format = date_format;
        if (price_format !== undefined) settings.price_format = price_format;
        if (contact_email !== undefined) settings.contact_email = contact_email;
        if (contact_phone !== undefined) settings.contact_phone = contact_phone;
        if (address !== undefined) settings.address = address;
        if (ai_api_key !== undefined) settings.ai_api_key = ai_api_key;
        if (logo_dark !== undefined) settings.logo_dark = logo_dark;
        if (logo_light !== undefined) settings.logo_light = logo_light;
        if (favicon !== undefined) settings.favicon = favicon;
        if (footer_description !== undefined) settings.footer_description = footer_description;
        if (google_maps_enabled !== undefined) settings.google_maps_enabled = !!google_maps_enabled;
        if (google_maps_api_key !== undefined) settings.google_maps_api_key = google_maps_api_key;
        if (req.body.enable_recaptcha !== undefined) settings.enable_recaptcha = !!req.body.enable_recaptcha;
        if (req.body.recaptcha_site_key !== undefined) settings.recaptcha_site_key = req.body.recaptcha_site_key;
        if (req.body.recaptcha_secret_key !== undefined) settings.recaptcha_secret_key = req.body.recaptcha_secret_key;

        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// FULL DATABASE BACKUP
const exportDatabaseBackup = async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const backupData = {};

        for (const collInfo of collections) {
            const collectionName = collInfo.name;
            const collectionData = await db.collection(collectionName).find({}).toArray();
            backupData[collectionName] = collectionData;
        }

        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `alibaba-b2b-backup-${dateStr}.json`;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // We stringify the entire DB mapping
        res.send(JSON.stringify(backupData, null, 2));

    } catch (err) {
        console.error('Database backup error:', err);
        res.status(500).json({ message: 'Failed to generate database backup' });
    }
};

module.exports = { getSiteSettings, updateSiteSettings, exportDatabaseBackup };
