const CommissionRule = require('../models/CommissionRule');

// @desc    Get all commission rules
// @route   GET /api/commissions
// @access  Private/Admin
exports.getCommissions = async (req, res) => {
    try {
        const rules = await CommissionRule.find().sort({ createdAt: -1 });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a commission rule
// @route   POST /api/commissions
// @access  Private/Admin
exports.createCommission = async (req, res) => {
    try {
        const rule = await CommissionRule.create(req.body);
        res.status(201).json(rule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a commission rule
// @route   PUT /api/commissions/:id
// @access  Private/Admin
exports.updateCommission = async (req, res) => {
    try {
        const rule = await CommissionRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!rule) return res.status(404).json({ message: 'Rule not found' });
        res.json(rule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a commission rule
// @route   DELETE /api/commissions/:id
// @access  Private/Admin
exports.deleteCommission = async (req, res) => {
    try {
        const rule = await CommissionRule.findByIdAndDelete(req.params.id);
        if (!rule) return res.status(404).json({ message: 'Rule not found' });
        res.json({ message: 'Rule removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Calculate commission for an amount (Public)
// @route   POST /api/commissions/calculate
// @access  Public
exports.calculateCommission = async (req, res) => {
    try {
        const { amount, category } = req.body;
        
        let rule = null;
        if (category) {
            rule = await CommissionRule.findOne({ appliesTo: category, is_active: true });
        }
        
        if (!rule) {
            rule = await CommissionRule.findOne({ appliesTo: 'All Products', is_active: true });
        }

        if (!rule) {
            // Default 3% fallback if no rules defined
            return res.json({ 
                commission_amount: parseFloat((amount * 0.03).toFixed(2)),
                rule_name: 'Default Service Fee (3%)' 
            });
        }

        let commission = 0;
        if (rule.type === 'Percentage') {
            commission = (amount * rule.value) / 100;
        } else {
            commission = rule.value;
        }

        res.json({
            commission_amount: parseFloat(commission.toFixed(2)),
            rule_name: rule.name,
            rule_type: rule.type,
            rule_value: rule.value
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
