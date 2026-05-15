const HomepageSection = require('../../models/HomepageSection');

// Generic sections config
const DEFAULT_SECTIONS = [
    { id_name: 'hero_banner', title: 'Global B2B Marketplace', subtitle: '', order: 1, is_active: true, data: {} },
    { id_name: 'categories', title: 'Browse Categories', subtitle: 'Explore thousands of products by category', order: 2, is_active: true, data: {} },
    { id_name: 'trending_products', title: 'Trending Products', subtitle: 'Most popular items people are sourcing right now', order: 3, is_active: true, data: {} },
    { id_name: 'featured_suppliers', title: 'Featured Suppliers', subtitle: 'Verified manufacturers & trusted global suppliers', order: 4, is_active: true, data: {} },
    { id_name: 'industry_section', title: 'Shop by Industry', subtitle: 'Curated product collections across top industries', order: 5, is_active: true, data: {} },
    { id_name: 'rfq_section', title: 'Request for Quotation', subtitle: '', order: 6, is_active: true, data: {} },
    { id_name: 'why_choose_us', title: 'Why Choose Us', subtitle: 'The most trusted B2B marketplace built for global trade', order: 7, is_active: true, data: {} },
    { id_name: 'app_promo', title: 'Mobile App', subtitle: 'Trade on the Go with Our Mobile App', order: 8, is_active: true, data: {} }
];

const getSections = async (req, res) => {
    try {
        let sections = await HomepageSection.find().sort({ order: 1 });
        if (sections.length === 0) {
            sections = await HomepageSection.insertMany(DEFAULT_SECTIONS);
        }
        res.json(sections);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateSectionsOrder = async (req, res) => {
    try {
        const { orderedIds } = req.body;
        for (let i = 0; i < orderedIds.length; i++) {
            await HomepageSection.findByIdAndUpdate(orderedIds[i], { order: i + 1 });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const toggleSection = async (req, res) => {
    try {
        const section = await HomepageSection.findById(req.params.id);
        if (!section) return res.status(404).json({ message: 'Not found' });
        section.is_active = !section.is_active;
        await section.save();
        res.json(section);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateSectionContent = async (req, res) => {
    try {
        const section = await HomepageSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(section);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getSections,
    updateSectionsOrder,
    toggleSection,
    updateSectionContent
};
