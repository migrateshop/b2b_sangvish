const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/adminController');
const { getPaymentSettings, updatePaymentSettings } = require('../../controllers/paymentSettingController');
const { getSocialLogin, updateSocialLogin } = require('../../controllers/socialLoginController');
const { getSiteSettings, updateSiteSettings, exportDatabaseBackup } = require('../../controllers/admin/siteSettingController');
const businessTypeController = require('../../controllers/admin/businessTypeController');
const emailTemplateController = require('../../controllers/admin/emailTemplateController');
const payoutMethodController = require('../../controllers/admin/payoutMethodController');
const { protect, authorizeRoles } = require('../../middlewares/authMiddleware');

// Base route is /api/admin
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/stats', adminController.getAdminStats);
router.get('/products', adminController.getAdminProducts);
router.put('/products/:id/approve', adminController.approveProduct);
router.put('/products/:id/reject', adminController.rejectProduct);
router.delete('/products/:id', adminController.deleteProduct);

router.get('/companies', adminController.getAdminCompanies);
router.put('/companies/:id/verify', adminController.verifyCompany);
router.post('/companies/:id/factory-audit', adminController.addFactoryAudit);

// Payment settings
router.get('/payment-settings', getPaymentSettings);
router.put('/payment-settings', updatePaymentSettings);

// Social Login settings
router.get('/social-login', getSocialLogin);
router.put('/social-login', updateSocialLogin);

// Audit Logs
const AuditLog = require('../../models/AuditLog');
router.get('/audit-logs', async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).populate('userId', 'email first_name last_name');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Risk Alerts (Fraud Detection)
router.get('/risk-alerts', adminController.getRiskAlerts);

// Site Settings (color picker etc)
router.get('/site-settings', getSiteSettings);
router.put('/site-settings', updateSiteSettings);
router.get('/database-backup', exportDatabaseBackup);

// Email Settings (.env modification)
const { getEmailSettings, updateEmailSettings } = require('../../controllers/admin/emailSettingController');
router.get('/email-settings', getEmailSettings);
router.put('/email-settings', updateEmailSettings);

// Dynamic Menu
router.get('/menu', (req, res) => {
    try {
        const menu = require('../../config/adminMenu.json');
        res.json(menu);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load menu configuration' });
    }
});

// Roles
router.get('/roles', async (req, res) => {
    try {
        const Role = require('../../models/Role');
        const roles = await Role.find();
        res.json(roles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Countries
const Country = require('../../models/Country');
router.get('/countries', async (req, res) => {
    try {
        const countries = await Country.find().sort({ name: 1 });
        res.json(countries);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/countries', async (req, res) => {
    try {
        const country = await Country.create(req.body);
        res.status(201).json(country);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.put('/countries/:id', async (req, res) => {
    try {
        const country = await Country.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(country);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.delete('/countries/:id', async (req, res) => {
    try {
        await Country.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/countries/seed', async (req, res) => {
    try {
        const countryList = [
            { name: 'Afghanistan', code: 'AF', dial_code: '+93', flag: '🇦🇫', phone_length: 9 },
            { name: 'Albania', code: 'AL', dial_code: '+355', flag: '🇦🇱', phone_length: 9 },
            { name: 'Algeria', code: 'DZ', dial_code: '+213', flag: '🇩🇿', phone_length: 9 },
            { name: 'Andorra', code: 'AD', dial_code: '+376', flag: '🇦🇩', phone_length: 6 },
            { name: 'Angola', code: 'AO', dial_code: '+244', flag: '🇦🇴', phone_length: 9 },
            { name: 'Argentina', code: 'AR', dial_code: '+54', flag: '🇦🇷', phone_length: 10 },
            { name: 'Australia', code: 'AU', dial_code: '+61', flag: '🇦🇺', phone_length: 9 },
            { name: 'Austria', code: 'AT', dial_code: '+43', flag: '🇦🇹', phone_length: 10 },
            { name: 'Bangladesh', code: 'BD', dial_code: '+880', flag: '🇧🇩', phone_length: 10 },
            { name: 'Belgium', code: 'BE', dial_code: '+32', flag: '🇧🇪', phone_length: 9 },
            { name: 'Brazil', code: 'BR', dial_code: '+55', flag: '🇧🇷', phone_length: 11 },
            { name: 'Canada', code: 'CA', dial_code: '+1', flag: '🇨🇦', phone_length: 10 },
            { name: 'China', code: 'CN', dial_code: '+86', flag: '🇨🇳', phone_length: 11 },
            { name: 'Egypt', code: 'EG', dial_code: '+20', flag: '🇪🇬', phone_length: 10 },
            { name: 'France', code: 'FR', dial_code: '+33', flag: '🇫🇷', phone_length: 9 },
            { name: 'Germany', code: 'DE', dial_code: '+49', flag: '🇩🇪', phone_length: 10 },
            { name: 'India', code: 'IN', dial_code: '+91', flag: '🇮🇳', phone_length: 10 },
            { name: 'Indonesia', code: 'ID', dial_code: '+62', flag: '🇮🇩', phone_length: 10 },
            { name: 'Italy', code: 'IT', dial_code: '+39', flag: '🇮🇹', phone_length: 10 },
            { name: 'Japan', code: 'JP', dial_code: '+81', flag: '🇯🇵', phone_length: 10 },
            { name: 'Malaysia', code: 'MY', dial_code: '+60', flag: '🇲🇾', phone_length: 9 },
            { name: 'Mexico', code: 'MX', dial_code: '+52', flag: '🇲🇽', phone_length: 10 },
            { name: 'Netherlands', code: 'NL', dial_code: '+31', flag: '🇳🇱', phone_length: 9 },
            { name: 'New Zealand', code: 'NZ', dial_code: '+64', flag: '🇳🇿', phone_length: 9 },
            { name: 'Pakistan', code: 'PK', dial_code: '+92', flag: '🇵🇰', phone_length: 10 },
            { name: 'Russia', code: 'RU', dial_code: '+7', flag: '🇷🇺', phone_length: 10 },
            { name: 'Saudi Arabia', code: 'SA', dial_code: '+966', flag: '🇸🇦', phone_length: 9 },
            { name: 'Singapore', code: 'SG', dial_code: '+65', flag: '🇸🇬', phone_length: 8 },
            { name: 'South Africa', code: 'ZA', dial_code: '+27', flag: '🇿🇦', phone_length: 9 },
            { name: 'South Korea', code: 'KR', dial_code: '+82', flag: '🇰🇷', phone_length: 10 },
            { name: 'Spain', code: 'ES', dial_code: '+34', flag: '🇪🇸', phone_length: 9 },
            { name: 'Switzerland', code: 'CH', dial_code: '+41', flag: '🇨🇭', phone_length: 9 },
            { name: 'Turkey', code: 'TR', dial_code: '+90', flag: '🇹🇷', phone_length: 10 },
            { name: 'United Arab Emirates', code: 'AE', dial_code: '+971', flag: '🇦🇪', phone_length: 9 },
            { name: 'United Kingdom', code: 'GB', dial_code: '+44', flag: '🇬🇧', phone_length: 10 },
            { name: 'United States', code: 'US', dial_code: '+1', flag: '🇺🇸', phone_length: 10 },
            { name: 'Vietnam', code: 'VN', dial_code: '+84', flag: '🇻🇳', phone_length: 10 }
        ];

        for (const c of countryList) {
            await Country.findOneAndUpdate({ code: c.code }, c, { upsert: true });
        }
        res.json({ message: 'Countries seeded successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// States
const State = require('../../models/State');
router.get('/states', async (req, res) => {
    try {
        const states = await State.find().populate('country', 'name');
        res.json(states);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/states', async (req, res) => {
    try {
        const state = await State.create(req.body);
        res.status(201).json(state);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.put('/states/:id', async (req, res) => {
    try {
        const state = await State.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(state);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.delete('/states/:id', async (req, res) => {
    try {
        await State.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Footer Menu
const FooterSection = require('../../models/FooterSection');
router.get('/footer-sections', async (req, res) => {
    try {
        const sections = await FooterSection.find().sort({ order: 1 });
        res.json(sections);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/footer-sections', async (req, res) => {
    try {
        const section = await FooterSection.create(req.body);
        res.status(201).json(section);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.put('/footer-sections/:id', async (req, res) => {
    try {
        const section = await FooterSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(section);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.delete('/footer-sections/:id', async (req, res) => {
    try {
        await FooterSection.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Notifications
router.get('/notifications', async (req, res) => {
    try {
        const Notification = require('../../models/Notification');
        const notifications = await Notification.find({ userId: req.user._id, type: 'admin' }).sort({ createdAt: -1 }).limit(10);
        res.json(notifications);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Withdrawal Requests Management
router.get('/withdraw-requests', async (req, res) => {
    try {
        const Transaction = require('../../models/Transaction');
        const requests = await Transaction.find({ type: 'withdraw' }).populate('user_id', 'email first_name last_name company_name payout_methods').sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/payout-methods', adminController.getSupplierPayouts);

// Global Payout Options (Available for suppliers)
router.get('/payout-settings', payoutMethodController.getPayoutMethods);
router.put('/payout-settings/:id', payoutMethodController.updatePayoutMethod);
router.delete('/payout-settings/:id', payoutMethodController.deletePayoutMethod);
router.post('/payout-settings/seed', payoutMethodController.seedPayoutMethods);

router.put('/withdraw-requests/:id/approve', async (req, res) => {
    try {
        const Transaction = require('../../models/Transaction');
        const User = require('../../models/User');
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Request not found' });
        
        const supplier = await User.findById(transaction.user_id);
        if (supplier.wallet_balance < transaction.amount) {
            return res.status(400).json({ message: 'Insufficient supplier balance' });
        }

        supplier.wallet_balance -= transaction.amount;
        await supplier.save({ validateBeforeSave: false });

        transaction.status = 'approved';
        await transaction.save();

        res.json({ success: true, message: 'Withdrawal approved and balance updated' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/withdraw-requests/:id/decline', async (req, res) => {
    try {
        const Transaction = require('../../models/Transaction');
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Request not found' });

        transaction.status = 'declined';
        await transaction.save();

        res.json({ success: true, message: 'Withdrawal declined' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Business Types
router.get('/business-types', businessTypeController.getBusinessTypes);
router.post('/business-types', businessTypeController.createBusinessType);
router.put('/business-types/:id', businessTypeController.updateBusinessType);
router.delete('/business-types/:id', businessTypeController.deleteBusinessType);

// Languages
const Language = require('../../models/Language');
router.get('/languages', async (req, res) => {
    try {
        const languages = await Language.find().sort({ name: 1 });
        res.json(languages);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/languages', async (req, res) => {
    try {
        const language = await Language.create(req.body);
        res.status(201).json(language);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.put('/languages/:id', async (req, res) => {
    try {
        const language = await Language.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(language);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.delete('/languages/:id', async (req, res) => {
    try {
        await Language.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Currencies
const Currency = require('../../models/Currency');
router.get('/currencies', async (req, res) => {
    try {
        const currencies = await Currency.find().sort({ code: 1 });
        res.json(currencies);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/currencies', async (req, res) => {
    try {
        const currency = await Currency.create(req.body);
        res.status(201).json(currency);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.put('/currencies/:id', async (req, res) => {
    try {
        const currency = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(currency);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.delete('/currencies/:id', async (req, res) => {
    try {
        await Currency.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Shipping Rules
const ShippingRule = require('../../models/ShippingRule');
router.get('/shipping-rules', async (req, res) => {
    try {
        const rules = await ShippingRule.find().sort({ country_name: 1 });
        res.json(rules);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/shipping-rules', async (req, res) => {
    try {
        const rule = await ShippingRule.create(req.body);
        res.status(201).json(rule);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.put('/shipping-rules/:id', async (req, res) => {
    try {
        const rule = await ShippingRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(rule);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
router.delete('/shipping-rules/:id', async (req, res) => {
    try {
        await ShippingRule.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Email Templates
router.get('/email-templates', emailTemplateController.getAllTemplates);
router.get('/email-templates/:id', emailTemplateController.getTemplateById);
router.post('/email-templates', emailTemplateController.createTemplate);
router.put('/email-templates/:id', emailTemplateController.updateTemplate);
router.delete('/email-templates/:id', emailTemplateController.deleteTemplate);

module.exports = router;
