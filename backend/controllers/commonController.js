const Language = require('../models/Language');
const Currency = require('../models/Currency');
const FooterSection = require('../models/FooterSection');
const Country = require('../models/Country');
const State = require('../models/State');

// Get all active languages
exports.getLanguages = async (req, res) => {
    try {
        const languages = await Language.find({ is_active: true }).sort('order');
        res.json(languages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all active currencies
exports.getCurrencies = async (req, res) => {
    try {
        const currencies = await Currency.find({ is_active: true }).sort('order');
        res.json(currencies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get business types
exports.getBusinessTypes = (req, res) => {
    const businessTypes = [
        { label: 'Merchant', value: 'merchant' },
        { label: 'Manufacturer', value: 'manufacturer' },
        { label: 'Wholesaler', value: 'wholesaler' },
        { label: 'Retailer', value: 'retailer' }
    ];
    res.json(businessTypes);
};

// Get countries
exports.getCountries = async (req, res) => {
    try {
        const countries = await Country.find({ status: 'Active' }).sort('name');
        res.json(countries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get states by country
exports.getStates = async (req, res) => {
    try {
        const { countryId } = req.params;
        console.log(`[DEBUG] Fetching states for countryId: ${countryId}`);
        if (!countryId || countryId === 'undefined') {
            return res.status(400).json({ message: 'Valid Country ID is required' });
        }

        const states = await State.find({ country: countryId }).sort('name');
        console.log(`[DEBUG] Found ${states.length} states`);
        res.json(states);
    } catch (err) {
        console.error(`[DEBUG] Error in getStates:`, err);
        res.status(500).json({ message: err.message });
    }
};

// Get footer sections
exports.getFooterSections = async (req, res) => {
    try {
        const sections = await FooterSection.find({ status: { $ne: 'inactive' } }).sort('order');
        res.json(sections);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get shipping rules
exports.getShippingRules = async (req, res) => {
    try {
        const ShippingRule = require('../models/ShippingRule');
        const rules = await ShippingRule.find({ status: 'active' });
        res.json(rules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Calculate shipping
exports.calculateShipping = async (req, res) => {
    try {
        const { products, dest_country, dest_state, dest_zip } = req.body;
        const ShippingRule = require('../models/ShippingRule');

        // Logic for calculating shipping cost
        // 1. Fetch all applicable rules for this country and state
        const query = {
            status: 'active',
            country_code: dest_country
        };
        if (dest_state) query.$or = [{ state_code: dest_state }, { state_code: 'all' }];

        const rules = await ShippingRule.find(query);

        // 2. Map thru rules and calculate each outcome
        const result = rules.map(rule => {
            let total_cost = rule.base_fee;
            let weight = 0;
            let cost_per_piece = 0;

            // 3. Simple distance mock (ZIP based logic would go here)
            const distance = Math.random() * 1000; // Mock distance

            // 4. Volume/Weight/Quantity calculation
            products.forEach(p => {
                total_cost += rule.per_unit_fee * p.quantity;
                cost_per_piece = rule.per_unit_fee;
            });

            // 5. Apply distance surcharge
            total_cost += (distance * 0.05);

            // 6. Delivery windows
            const today = new Date();
            const delivery_start = new Date(today);
            delivery_start.setDate(today.getDate() + rule.estimated_days_min);
            const delivery_end = new Date(today);
            delivery_end.setDate(today.getDate() + rule.estimated_days_max);

            return {
                id: rule._id,
                name: rule.carrier,
                distance: distance.toFixed(2),
                total_cost: total_cost.toFixed(2),
                cost_per_piece: cost_per_piece.toFixed(2),
                delivery_range: `${delivery_start.toDateString()} - ${delivery_end.toDateString()}`,
                minDays: rule.estimated_days_min,
                maxDays: rule.estimated_days_max
            };
        });

        // 7. Sort by lowest price
        result.sort((a, b) => a.total_cost - b.total_cost);

        res.json({ shipping_methods: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all active trust items
exports.getTrustItems = async (req, res) => {
    try {
        const TrustItem = require('../models/TrustItem');
        const items = await TrustItem.find({ isActive: true }).sort('order');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all active partners
exports.getPartners = async (req, res) => {
    try {
        const Partner = require('../models/Partner');
        const items = await Partner.find({ isActive: true }).sort('order');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
