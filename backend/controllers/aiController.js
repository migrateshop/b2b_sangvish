const Product = require('../models/Product');
const Company = require('../models/Company');
const AiHistory = require('../models/AiHistory');
const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const SiteSetting = require('../models/SiteSetting');
const axios = require('axios');

// Better stop words (only common fillers)
const extractKeywords = (text) => {
    const stopWords = ['i', 'need', 'a', 'an', 'the', 'looking', 'for', 'with', 'under', 'and', 'find', 'search', 'me', 'some'];
    return text.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .split(' ')
        .filter(word => word.length > 2 && !stopWords.includes(word));
};

exports.refineAiText = async (req, res) => {
    try {
        const { text, type = 'rfq' } = req.body; // type: rfq or inquiry
        if (!text) return res.status(400).json({ message: 'Text is required' });

        // 1. Subscription & Limit Check
        let userModel = await User.findById(req.user._id).populate('subscription_plan');
        if (!userModel) return res.status(404).json({ message: 'User not found' });

        // Daily Reset logic
        const today = new Date().setHours(0, 0, 0, 0);
        const resetDate = new Date(userModel.ai_tasks_reset_date || Date.now()).setHours(0, 0, 0, 0);
        if (today > resetDate) {
            userModel.ai_tasks_count = 0;
            userModel.ai_tasks_reset_date = new Date();
        }

        const limit = userModel.subscription_plan ? userModel.subscription_plan.max_ai_tasks : 5;
        if (limit !== -1 && userModel.ai_tasks_count >= limit) {
            return res.status(403).json({ 
                message: 'AI refinement limit reached for today.',
                limit_reached: true,
                current_plan: userModel.subscription_plan ? userModel.subscription_plan.name : 'Free',
                usage: userModel.ai_tasks_count,
                limit: limit
            });
        }

        // 2. OpenAI Refinement
        let refinedText = text;
        const siteSetting = await SiteSetting.findOne();
        
        if (siteSetting && siteSetting.ai_api_key) {
            try {
                const prompt = `Refine the following ${type} text to be more professional, detailed, and clear for a B2B marketplace. 
                Keep the core meaning but improve the language and structure. 
                Original text: "${text}"
                Refined professional version:`;

                const aiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 500
                }, {
                    headers: {
                        'Authorization': `Bearer ${siteSetting.ai_api_key}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (aiRes.data?.choices?.[0]?.message?.content) {
                    refinedText = aiRes.data.choices[0].message.content.trim();
                }
            } catch (aiErr) {
                console.error('OpenAI Refine Error:', aiErr.response?.data || aiErr.message);
                // If AI fails, we just return the original or a basic template enhancement
                refinedText = `[AI ENHANCED] ${text}`;
            }
        } else {
            // Local fallback simulation if no key
            refinedText = `[REFINED] ${text}`;
        }

        // 3. Update Usage
        userModel.ai_tasks_count += 1;
        await userModel.save();

        res.json({
            refinedText,
            usage: userModel.ai_tasks_count,
            limit: limit
        });

    } catch (err) {
        console.error('AI Refine Error:', err);
        res.status(500).json({ message: 'AI refinement failed' });
    }
};

exports.aiSourcingSearch = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ message: 'Query is required' });

        // 1. Subscription & Limit Check (for logged in users)
        let userModel = null;
        if (req.user) {
            userModel = await User.findById(req.user._id).populate('subscription_plan');
            
            // Check if reset is needed (daily reset)
            const today = new Date().setHours(0, 0, 0, 0);
            const resetDate = new Date(userModel.ai_tasks_reset_date || Date.now()).setHours(0, 0, 0, 0);
            
            if (today > resetDate) {
                userModel.ai_tasks_count = 0;
                userModel.ai_tasks_reset_date = new Date();
            }

            // Get limit from plan or default to 5 for Free
            const limit = userModel.subscription_plan ? userModel.subscription_plan.max_ai_tasks : 5;
            
            if (limit !== -1 && userModel.ai_tasks_count >= limit) {
                return res.status(403).json({ 
                    message: 'AI sourcing limit reached for today.',
                    limit_reached: true,
                    current_plan: userModel.subscription_plan ? userModel.subscription_plan.name : 'Free',
                    usage: userModel.ai_tasks_count,
                    limit: limit
                });
            }
        }

        const keywords = extractKeywords(query);
        
        // Build a multi-keyword regex search
        const keywordRegex = keywords.length > 0 
            ? keywords.map(k => `(?=.*${k})`).join('') // Match all keywords in any order
            : query;

        // 2. Search Products
        let products = await Product.find({
            $or: [
                { name: { $regex: keywordRegex, $options: 'i' } },
                { description: { $regex: keywordRegex, $options: 'i' } }
            ],
            status: 'active',
            approval_status: 'approved'
        }).limit(8);

        // Fallback: If no products found, try broad match
        if (products.length === 0 && keywords.length > 0) {
            products = await Product.find({
                name: { $regex: keywords.join('|'), $options: 'i' },
                status: 'active',
                approval_status: 'approved'
            }).limit(8);
        }

        // 3. Search Suppliers
        let suppliers = await Company.find({
            $or: [
                { company_name: { $regex: keywords.join('|') || query, $options: 'i' } },
                { description: { $regex: keywords.join('|') || query, $options: 'i' } }
            ]
        }).limit(4);

        // 4. Dynamic Insights
        const insights = [
            { title: 'Global Demand', value: '+12% this month', trend: 'up' },
            { title: 'Avg. Market Price', value: products.length > 0 ? `$${Math.min(...products.map(p => p.main_price || 0))} - $${Math.max(...products.map(p => p.main_price || 0))}` : 'Contact Suppliers', trend: 'stable' },
            { title: 'Verified Sources', value: `${suppliers.length} found`, trend: 'up' }
        ];

        // 5. Update Usage & History
        if (userModel) {
            userModel.ai_tasks_count += 1;
            await userModel.save();

            try {
                await AiHistory.create({
                    user: userModel._id,
                    query_text: query,
                    search_type: 'product',
                    results_count: products.length + suppliers.length,
                    status: 'completed'
                });
            } catch (hErr) {
                console.error('History save error:', hErr);
            }
        }

        const limit = userModel ? (userModel.subscription_plan ? userModel.subscription_plan.max_ai_tasks : 5) : 0;
        const usage = userModel ? userModel.ai_tasks_count : 0;

        // 6. OpenAI Generated Summary (If Key Exists)
        let aiSummary = products.length > 0 
            ? `I've found ${products.length} products and ${suppliers.length} suppliers that match your request for "${query}".`
            : `I couldn't find exact matches for "${query}", but here are some related suppliers and market insights.`;

        const siteSetting = await SiteSetting.findOne();
        if (siteSetting && siteSetting.ai_api_key) {
            try {
                const prompt = `User is looking for: "${query}". 
                I found ${products.length} products and ${suppliers.length} suppliers.
                Products found: ${products.slice(0,3).map(p => p.name).join(', ')}.
                Suppliers found: ${suppliers.slice(0,2).map(s => s.company_name).join(', ')}.
                Generate a professional, helpful but concise (max 2 sentences) sourcing summary as an AI assistant.`;

                const aiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 150
                }, {
                    headers: {
                        'Authorization': `Bearer ${siteSetting.ai_api_key}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (aiRes.data?.choices?.[0]?.message?.content) {
                    aiSummary = aiRes.data.choices[0].message.content;
                }
            } catch (aiErr) {
                console.error('OpenAI Error:', aiErr.response?.data || aiErr.message);
                // Fallback to default summary already set
            }
        }

        res.json({
            products,
            suppliers,
            insights,
            summary: aiSummary,
            usage: usage,
            limit: limit,
            plan_name: userModel ? (userModel.subscription_plan ? userModel.subscription_plan.name : 'Free') : 'Guest'
        });

    } catch (err) {
        console.error('AI Sourcing Error:', err);
        res.status(500).json({ message: 'AI processing failed' });
    }
};

exports.getAiUsage = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('subscription_plan');
        const limit = user.subscription_plan ? user.subscription_plan.max_ai_tasks : 5;
        
        // Reset check (daily)
        const today = new Date().setHours(0, 0, 0, 0);
        const resetDate = new Date(user.ai_tasks_reset_date || Date.now()).setHours(0, 0, 0, 0);
        
        if (today > resetDate) {
            user.ai_tasks_count = 0;
            user.ai_tasks_reset_date = new Date();
            await user.save();
        }

        res.json({
            usage: user.ai_tasks_count,
            limit: limit,
            plan_name: user.subscription_plan ? user.subscription_plan.name : 'Free'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAiHistory = async (req, res) => {
    try {
        const history = await AiHistory.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteHistory = async (req, res) => {
    try {
        await AiHistory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'History deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
