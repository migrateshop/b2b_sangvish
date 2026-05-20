const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
// User model lazy-loaded in functions to avoid initialization issues

// Utility: Recursively find all child category IDs
const getChildCategoryIds = async (parentId) => {
    const cleanId = typeof parentId === 'string' && mongoose.Types.ObjectId.isValid(parentId)
        ? new mongoose.Types.ObjectId(parentId)
        : parentId;
    let ids = [cleanId];
    const children = await Category.find({ parent: cleanId, status: 'active' }).select('_id');
    for (const child of children) {
        const subIds = await getChildCategoryIds(child._id);
        ids = ids.concat(subIds);
    }
    return ids;
};

// ─────────────────────────────────────────────
// PUBLIC: Get all active/approved products with filtering
// GET /api/products
// ─────────────────────────────────────────────
exports.getProducts = async (req, res) => {
    try {
        const {
            keyword, category_id, min_price, max_price,
            min_moq, country, supplier_type, verified_only,
            rating_min, sort_by, page = 1, limit = 20, isFeatured, section,
            verified_pro, trade_assurance, moq_under_5, five_plus_years,
            rating_45, ce_cert, emc_cert, bulk, sample_available
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = { status: 'active', approval_status: 'approved', countInStock: { $gt: 0 } };
        if (isFeatured === 'true' || isFeatured === true) query.isFeatured = true;

        // ALGORITHMIC SECTION LOGIC
        // If section is provided, we use the strategy requested: auto-calculating best items
        let pipelineSort = false; // Flag to indicate if we've already handled sorting via pipeline

        if (section === 'Top Deals') {
            // Logic: Highest discount items
            query.oldPrice = { $gt: 0 };
        } else if (section === 'Top Ranking') {
            // Logic: Sorted by ranking_score (already calculated in pre-save)
            // No extra filter needed, just sort later
        } else if (section === 'New Arrivals') {
            // Logic: Recently added - Filter for last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            query.createdAt = { $gte: sevenDaysAgo };
        } else if (section && section !== 'undefined') {
            // Fallback for any legacy manual sections
            query.section = section;
        }

        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (category_id && category_id !== 'undefined') {
            const allCategoryIds = await getChildCategoryIds(category_id);
            query.category = { $in: allCategoryIds };
        }

        if (min_price || max_price) {
            query.main_price = {};
            if (min_price) query.main_price.$gte = parseFloat(min_price);
            if (max_price) query.main_price.$lte = parseFloat(max_price);
        }

        if (min_moq) query.moq = { $lte: parseInt(min_moq) };

        if (rating_min) {
            query.rating = { $gte: parseFloat(rating_min) };
        }

        if (moq_under_5 === 'true') {
            query.moq = { $lte: 5 };
        }

        if (bulk === 'true') {
            query.moq = { $gte: 10 };
        }

        if (sample_available === 'true') {
            query.sample_available = true;
        }

        if (rating_45 === 'true') {
            query.rating = { $gte: 4.5 };
        }

        // Special requested behaviors for sorting filters
        if (sort_by === 'rating') {
            if (!query.rating) query.rating = {};
            query.rating.$gte = 4.5;
        }

        if (sort_by === 'recent') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            query.createdAt = { $gte: sevenDaysAgo };
        }

        const pipeline = [];
        pipeline.push({ $match: query });

        // Add calculated fields for sorting if needed
        if (section === 'Top Deals') {
            pipeline.push({
                $addFields: {
                    discountAmount: { $subtract: ["$oldPrice", "$main_price"] },
                    discountPercent: {
                        $cond: [
                            { $gt: ["$oldPrice", 0] },
                            { $divide: [{ $subtract: ["$oldPrice", "$main_price"] }, "$oldPrice"] },
                            0
                        ]
                    }
                }
            });
        }

        pipeline.push({
            $lookup: { from: 'users', localField: 'supplier', foreignField: '_id', as: 'supplier_info' }
        });
        pipeline.push({ $unwind: '$supplier_info' });

        pipeline.push({
            $lookup: { from: 'subscriptionplans', localField: 'supplier_info.subscription_plan', foreignField: '_id', as: 'supplier_info.subscription_plan_info' }
        });
        pipeline.push({ $unwind: { path: '$supplier_info.subscription_plan_info', preserveNullAndEmptyArrays: true } });

        // Join company info for advanced filters (Location name, Certifications)
        pipeline.push({
            $lookup: { from: 'companies', localField: 'supplier', foreignField: 'user_id', as: 'company_info' }
        });
        pipeline.push({ $unwind: { path: '$company_info', preserveNullAndEmptyArrays: true } });

        if (verified_only === 'true' || trade_assurance === 'true') {
            pipeline.push({ $match: { 'supplier_info.is_verified': true } });
        }

        if (verified_pro === 'true') {
            pipeline.push({
                $match: {
                    $or: [
                        { 'supplier_info.subscription_plan_info.has_verified_badge': true },
                        { isPremium: 1 }
                    ]
                }
            });
        }

        if (five_plus_years === 'true') {
            const fiveYearsAgo = new Date();
            fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
            pipeline.push({
                $match: {
                    $or: [
                        { 'company_info.years_experience': { $gte: 5 } },
                        { 'supplier_info.createdAt': { $lte: fiveYearsAgo } }
                    ]
                }
            });
        }

        if (country) {
            pipeline.push({
                $match: {
                    $or: [
                        { 'supplier_info.country_code': country.toUpperCase() },
                        { 'company_info.country': { $regex: country, $options: 'i' } }
                    ]
                }
            });
        }

        if (supplier_type) pipeline.push({ $match: { 'supplier_info.business_type': supplier_type } });

        // Certifications filter
        const { certifications } = req.query;
        if (certifications) {
            const certArray = certifications.split(',').map(c => c.trim());
            pipeline.push({ $match: { 'company_info.certifications': { $in: certArray } } });
        }

        if (ce_cert === 'true') {
            pipeline.push({ $match: { 'company_info.certifications': { $regex: 'CE', $options: 'i' } } });
        }

        if (emc_cert === 'true') {
            pipeline.push({ $match: { 'company_info.certifications': { $regex: 'EMC', $options: 'i' } } });
        }

        pipeline.push({
            $addFields: {
                isPremium: {
                    $cond: [{ $ifNull: ["$supplier_info.subscription_plan", false] }, 1, 0]
                }
            }
        });

        // Sales Region Filtering
        const { user_country } = req.query;
        if (user_country && user_country !== 'undefined') {
            pipeline.push({
                $match: {
                    $or: [
                        { sales_type: 'worldwide' },
                        { sales_type: { $exists: false } },
                        { sales_type: 'specific', countries: { $in: [user_country.toUpperCase()] } }
                    ]
                }
            });
        }

        // SORTING LOGIC
        let sortObj = { isPromoted: -1, isPremium: -1, ppc_bid: -1, createdAt: -1 };

        // Use sort_by if provided, otherwise use section default
        if (sort_by === 'price_asc') sortObj = { main_price: 1 };
        else if (sort_by === 'price_desc') sortObj = { main_price: -1 };
        else if (sort_by === 'rating') sortObj = { rating: -1 };
        else if (sort_by === 'ranking') sortObj = { ranking_score: -1 };
        else if (sort_by === 'recent') sortObj = { createdAt: -1 };
        else if (section === 'Top Deals') {
            sortObj = { discountPercent: -1, isPromoted: -1, isPremium: -1 };
        } else if (section === 'Top Ranking' || section === 'Top ranking') {
            sortObj = { ranking_score: -1, isPromoted: -1, isPremium: -1 };
        } else if (section === 'New Arrivals' || section === 'New arrivals') {
            sortObj = { createdAt: -1, isPromoted: -1, isPremium: -1 };
        }

        pipeline.push({ $sort: sortObj });

        const countPipeline = [...pipeline, { $count: 'total' }];
        const totalResult = await Product.aggregate(countPipeline);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;

        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });
        pipeline.push({
            $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category_info' }
        });
        pipeline.push({ $unwind: '$category_info' });

        const products = await Product.aggregate(pipeline);
        res.json({ products, page: parseInt(page), pages: Math.ceil(total / limit), total });
    } catch (error) {
        console.error('getProducts error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUBLIC: Get single product
// GET /api/products/:id
// ─────────────────────────────────────────────
exports.getProductById = async (req, res) => {
    try {
        const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
            ? { _id: req.params.id }
            : { slug: req.params.id };

        let product = await Product.findOne(query)
            .populate('category')
            .populate({
                path: 'supplier',
                select: 'first_name last_name company_name is_verified country_code business_type createdAt logo subscription_plan',
                populate: { path: 'subscription_plan' }
            });

        // Fallback for legacy products where slug wasn't saved in DB
        if (!product && !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            const cleanSlug = req.params.id.replace(/-/g, ' ');
            product = await Product.findOne({ name: { $regex: new RegExp(cleanSlug, 'i') } })
                .populate('category')
                .populate({
                    path: 'supplier',
                    select: 'first_name last_name company_name is_verified country_code business_type createdAt logo subscription_plan',
                    populate: { path: 'subscription_plan' }
                });
        }

        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Increment views asynchronously directly in DB to avoid VersionError
        Product.updateOne({ _id: product._id }, { $inc: { views: 1 } }).catch(err => console.error('View increment error', err));
        product.views = (product.views || 0) + 1;

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// SUPPLIER: Create product
// POST /api/products
// ─────────────────────────────────────────────
exports.createProduct = async (req, res) => {
    try {
        const {
            name, description, category, sku, moq, currency,
            price_tiers, variants, key_attributes, countInStock, status, section, oldPrice,
            sales_type, countries
        } = req.body;

        if (!name || !description || !category) {
            return res.status(400).json({ message: 'Name, description and category are required.' });
        }

        if (!sku || !sku.trim()) {
            return res.status(400).json({ message: 'SKU is required.' });
        }
        if (moq === undefined || moq === null || moq === '' || isNaN(Number(moq)) || Number(moq) <= 0) {
            return res.status(400).json({ message: 'MOQ must be a positive number greater than 0.' });
        }
        if (countInStock === undefined || countInStock === null || countInStock === '') {
            return res.status(400).json({ message: 'Stock is required.' });
        }
        if (!currency || !currency.trim()) {
            return res.status(400).json({ message: 'Currency is required.' });
        }
        if (!sales_type) {
            return res.status(400).json({ message: 'Sales Region is required.' });
        }
        if (sales_type === 'specific') {
            const countriesArr = countries ? (typeof countries === 'string' ? JSON.parse(countries) : countries) : [];
            if (!countriesArr || countriesArr.length === 0) {
                return res.status(400).json({ message: 'At least one country must be selected for specific sales region.' });
            }
        }

        // Verify that the category is a subcategory (no active children exist in Category)
        const subCatsCount = await Category.countDocuments({ parent: category, status: 'active' });
        if (subCatsCount > 0) {
            return res.status(400).json({ message: 'Please select a specific subcategory, not a parent category.' });
        }

        // ── Subscription Check ──
        const User = require('../models/User');
        const user = await User.findById(req.user._id).populate('subscription_plan');
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'supplier') {
            const plan = user.subscription_plan;
            const isExpired = user.subscription_end && new Date() > user.subscription_end;

            if (!plan || isExpired) {
                return res.status(403).json({ message: isExpired ? 'Your subscription has expired. Please renew to add products.' : 'Please subscribe to a plan to add products.' });
            }

            // Check product limit (unless unlimited -1 or 0)
            if (plan.max_products !== -1 && plan.max_products !== 0) {
                const productCount = await Product.countDocuments({ supplier: user._id });
                if (productCount >= plan.max_products) {
                    return res.status(403).json({ message: `Product limit reached for ${plan.name} plan (${plan.max_products}). Please upgrade to add more.` });
                }
            }

            // Check image limit per product
            if (plan.max_images_per_product !== -1 && plan.max_images_per_product !== 0) {
                const coverCount = req.files && req.files.cover_image ? req.files.cover_image.length : 0;
                const imageCount = req.files && req.files.images ? req.files.images.length : 0;
                if ((coverCount + imageCount) > plan.max_images_per_product) {
                    return res.status(403).json({ message: `Image limit exceeded. Your ${plan.name} plan allows up to ${plan.max_images_per_product} images per product.` });
                }
            }
        }

        // Parse JSON strings from multipart form
        let parsedPriceTiers = [];
        let parsedVariants = [];
        let parsedKeyAttributes = [];
        try {
            if (price_tiers) parsedPriceTiers = typeof price_tiers === 'string' ? JSON.parse(price_tiers) : price_tiers;
            if (variants) parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
            if (key_attributes) parsedKeyAttributes = typeof key_attributes === 'string' ? JSON.parse(key_attributes) : key_attributes;
        } catch (e) {
            return res.status(400).json({ message: 'Invalid JSON in price_tiers, variants, or key_attributes.' });
        }

        let parsedCountries = [];
        if (countries) {
            try {
                parsedCountries = typeof countries === 'string' ? JSON.parse(countries) : countries;
            } catch (e) {
                console.error('Error parsing countries:', e);
            }
        }

        if (!parsedPriceTiers || parsedPriceTiers.length === 0) {
            return res.status(400).json({ message: 'At least one tier price is required.' });
        }

        // Handle uploaded images
        const imageUrls = req.files && req.files.images ? req.files.images.map(f => `/uploads/products/${f.filename}`) : [];
        const coverImageUrl = req.files && req.files.cover_image && req.files.cover_image.length > 0 
            ? `/uploads/products/${req.files.cover_image[0].filename}` 
            : '';
            
        // Final image determination: cover image goes first implicitly in main_image
        // Put all images (including cover if present) into the images array. 
        // Or if main_image is separate, just store it. Alibaba often has it in both or separate.
        // We'll store cover_image as main_image.
        const main_image = coverImageUrl || (imageUrls.length > 0 ? imageUrls[0] : '');
        const allImages = coverImageUrl ? [coverImageUrl, ...imageUrls] : imageUrls;

        // Parse customization options if provided
        let parsedCustomizationOptions = [];
        if (req.body.customization_options) {
            try {
                parsedCustomizationOptions = typeof req.body.customization_options === 'string'
                    ? JSON.parse(req.body.customization_options)
                    : req.body.customization_options;
            } catch (e) {
                console.error('Error parsing customization_options:', e);
            }
        }

        const product = new Product({
            name,
            description,
            category,
            sku: sku || '',
            moq: moq || 1,
            currency: currency || 'USD',
            price_tiers: parsedPriceTiers,
            variants: parsedVariants,
            key_attributes: parsedKeyAttributes,
            images: allImages,
            main_image,
            video: req.body.video || '',
            sample_available: req.body.sample_available === 'true' || req.body.sample_available === true,
            sample_price: parseFloat(req.body.sample_price) || 0,
            customization_available: req.body.customization_available === 'true' || req.body.customization_available === true,
            customization_options: parsedCustomizationOptions,
            countInStock: countInStock || 0,
            status: status || 'draft',
            approval_status: 'pending',
            section: section || 'None',
            oldPrice: oldPrice || 0,
            sales_type: sales_type || 'worldwide',
            countries: parsedCountries,
            supplier: req.user._id
        });

        const saved = await product.save();

        const { sendNotification } = require('../services/notificationService');
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await sendNotification(
                req.io,
                admin._id,
                'New Product Created',
                `Supplier has created a new product "${product.name}" and it is pending approval.`,
                'admin',
                '/admin/products'
            );
        }

        res.status(201).json({ success: true, product: saved });
    } catch (error) {
        console.error('createProduct error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// SUPPLIER/ADMIN: Update product
// PUT /api/products/:id
// ─────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Supplier can only update their own
        if ((req.user.roles?.includes('supplier') || req.user.role === 'supplier') && product.supplier.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this product' });
        }

        const {
            name, description, category, sku, moq, currency,
            price_tiers, variants, key_attributes, countInStock, status, section, oldPrice, keep_images,
            sales_type, countries
        } = req.body;

        if (name !== undefined && !name.trim()) {
            return res.status(400).json({ message: 'Name is required.' });
        }
        if (description !== undefined && !description.trim()) {
            return res.status(400).json({ message: 'Description is required.' });
        }
        if (category !== undefined) {
            if (!category) {
                return res.status(400).json({ message: 'Category is required.' });
            }
            const subCatsCount = await Category.countDocuments({ parent: category, status: 'active' });
            if (subCatsCount > 0) {
                return res.status(400).json({ message: 'Please select a specific subcategory, not a parent category.' });
            }
        }
        if (sku !== undefined && (!sku || !sku.trim())) {
            return res.status(400).json({ message: 'SKU is required.' });
        }
        if (moq !== undefined && (moq === '' || isNaN(Number(moq)) || Number(moq) <= 0)) {
            return res.status(400).json({ message: 'MOQ must be a positive number greater than 0.' });
        }
        if (countInStock !== undefined && (countInStock === undefined || countInStock === null || countInStock === '')) {
            return res.status(400).json({ message: 'Stock is required.' });
        }
        if (currency !== undefined && (!currency || !currency.trim())) {
            return res.status(400).json({ message: 'Currency is required.' });
        }
        if (sales_type !== undefined && !sales_type) {
            return res.status(400).json({ message: 'Sales Region is required.' });
        }
        if (sales_type === 'specific' || (sales_type === undefined && product.sales_type === 'specific')) {
            const countriesArr = countries ? (typeof countries === 'string' ? JSON.parse(countries) : countries) : product.countries;
            if (!countriesArr || countriesArr.length === 0) {
                return res.status(400).json({ message: 'At least one country must be selected for specific sales region.' });
            }
        }

        // Parse JSON
        let parsedPriceTiers = product.price_tiers;
        let parsedVariants = product.variants;
        let parsedKeyAttributes = product.key_attributes;
        try {
            if (price_tiers) parsedPriceTiers = typeof price_tiers === 'string' ? JSON.parse(price_tiers) : price_tiers;
            if (variants) parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
            if (key_attributes) parsedKeyAttributes = typeof key_attributes === 'string' ? JSON.parse(key_attributes) : key_attributes;
        } catch (e) {
            return res.status(400).json({ message: 'Invalid JSON in price_tiers, variants, or key_attributes.' });
        }

        // Determine images: keep existing + new uploads
        let existingImages = [];
        if (keep_images) {
            existingImages = typeof keep_images === 'string' ? JSON.parse(keep_images) : keep_images;
        }
        const newImages = req.files && req.files.images ? req.files.images.map(f => `/uploads/products/${f.filename}`) : [];
        
        let main_image = product.main_image; // Default
        const newCoverImage = req.files && req.files.cover_image && req.files.cover_image.length > 0
            ? `/uploads/products/${req.files.cover_image[0].filename}`
            : null;

        if (req.body.existing_cover_image !== undefined) {
             main_image = req.body.existing_cover_image; // Supplier explicitly changed/removed the existing cover
        }
        if (newCoverImage) {
             main_image = newCoverImage;
        }

        // Add the cover image to the front of images array
        // We ensure main_image is always at index 0 of the images array if it exists
        let allImages = [...existingImages, ...newImages];
        if (main_image) {
            allImages = allImages.filter(img => img !== main_image); // Remove it if it exists inside
            allImages.unshift(main_image); // Prepend it
        }

        // ── Subscription Image Limit Check ──
        if (req.user.roles?.includes('supplier') || req.user.role === 'supplier') {
            const User = require('../models/User');
            const user = await User.findById(req.user._id).populate('subscription_plan');
            const plan = user?.subscription_plan;
            if (plan && plan.max_images_per_product !== -1 && plan.max_images_per_product !== 0) {
                if (allImages.length > plan.max_images_per_product) {
                    return res.status(403).json({ message: `Image limit exceeded. Your ${plan.name} plan allows up to ${plan.max_images_per_product} images per product.` });
                }
            }
        }

        if (name) product.name = name;
        if (description) product.description = description;
        if (category) product.category = category;
        if (sku !== undefined) product.sku = sku;
        if (moq !== undefined) product.moq = moq;
        if (currency) product.currency = currency;
        product.price_tiers = parsedPriceTiers;
        product.variants = parsedVariants;
        product.key_attributes = parsedKeyAttributes;
        
        product.images = allImages;
        product.main_image = main_image || '';
        if (countInStock !== undefined) product.countInStock = countInStock;
        if (status) product.status = status;
        if (section) product.section = section;
        if (oldPrice !== undefined) product.oldPrice = oldPrice;
        if (req.body.video !== undefined) product.video = req.body.video;
        if (req.body.sample_available !== undefined) product.sample_available = req.body.sample_available === 'true' || req.body.sample_available === true;
        if (req.body.sample_price !== undefined) product.sample_price = parseFloat(req.body.sample_price) || 0;

        if (req.body.customization_available !== undefined) {
            product.customization_available = req.body.customization_available === 'true' || req.body.customization_available === true;
        }

        if (req.body.customization_options) {
            try {
                product.customization_options = typeof req.body.customization_options === 'string'
                    ? JSON.parse(req.body.customization_options)
                    : req.body.customization_options;
            } catch (e) { }
        }

        if (sales_type) product.sales_type = sales_type;
        if (countries) {
            try {
                product.countries = typeof countries === 'string' ? JSON.parse(countries) : countries;
            } catch (e) { }
        }
        if (req.body.customization_options !== undefined) {
            try {
                product.customization_options = typeof req.body.customization_options === 'string'
                    ? JSON.parse(req.body.customization_options)
                    : req.body.customization_options;
            } catch (e) {
                console.error('Error parsing customization_options update:', e);
            }
        }

        // Reset approval if supplier edits
        if (req.user.roles?.includes('supplier') || req.user.role === 'supplier') {
            product.approval_status = 'pending';
        }

        const updated = await product.save();
        res.json({ success: true, product: updated });
    } catch (error) {
        console.error('updateProduct error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// SHARED: Upload single image (for variants)
// POST /api/products/upload-single
// ─────────────────────────────────────────────
exports.uploadSingleImage = async (req, res) => {
    try {
        const file = req.file || (req.files && (Array.isArray(req.files) ? req.files[0] : (req.files.images && req.files.images[0])));
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const fileUrl = `/uploads/products/${file.filename}`;
        res.json({ success: true, url: fileUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// SUPPLIER/ADMIN: Delete product
// DELETE /api/products/:id
// ─────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if ((req.user.roles?.includes('supplier') || req.user.role === 'supplier') && product.supplier.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this product' });
        }

        await product.deleteOne();
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// SUPPLIER: Toggle showcase status (isFeatured)
// PUT /api/products/:id/toggle-showcase
// ─────────────────────────────────────────────
exports.toggleShowcase = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (product.supplier.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // If trying to set to true, check subscription quota
        if (!product.isFeatured) {
            const User = require('../models/User');
            const user = await User.findById(req.user._id).populate('subscription_plan');
            const plan = user?.subscription_plan;

            if (!plan) {
                return res.status(403).json({ message: 'Please subscribe to a plan to use the Showcase feature.' });
            }

            if (plan.max_showcases !== -1) {
                const currentShowcases = await Product.countDocuments({
                    supplier: req.user._id,
                    isFeatured: true
                });
                if (currentShowcases >= plan.max_showcases) {
                    return res.status(403).json({ message: `Showcase limit reached for ${plan.name} plan (${plan.max_showcases}). Please remove another showcase first or upgrade.` });
                }
            }
        }

        product.isFeatured = !product.isFeatured;
        await product.save();

        res.json({ success: true, isFeatured: product.isFeatured, message: product.isFeatured ? 'Product added to store showcase.' : 'Product removed from showcase.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// SUPPLIER: My products
// GET /api/products/my
// ─────────────────────────────────────────────
exports.getMyProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, approval_status, keyword } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { supplier: req.user._id };
        if (status) query.status = status;
        if (approval_status) query.approval_status = approval_status;
        if (keyword) query.$text = { $search: keyword };

        const total = await Product.countDocuments(query);
        const totalCountGlobal = await Product.countDocuments({ supplier: req.user._id });
        const products = await Product.find(query)
            .populate('category', 'title slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({ products, page: parseInt(page), pages: Math.ceil(total / limit), total, totalCountGlobal });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// ADMIN: All products
// GET /api/products/admin/all
// ─────────────────────────────────────────────
exports.getAllProductsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, approval_status, keyword } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (status) query.status = status;
        if (approval_status) query.approval_status = approval_status;
        if (keyword) query.$text = { $search: keyword };

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category', 'title slug')
            .populate('supplier', 'first_name last_name company_name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({ products, page: parseInt(page), pages: Math.ceil(total / limit), total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// ADMIN: Approve product
// PUT /api/products/:id/approve
// ─────────────────────────────────────────────
exports.approveProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { approval_status: 'approved', status: 'active', approval_note: '' },
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// ADMIN: Reject product
// PUT /api/products/:id/reject
// ─────────────────────────────────────────────
exports.rejectProduct = async (req, res) => {
    try {
        const { note } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { approval_status: 'rejected', status: 'inactive', approval_note: note || 'Rejected by admin.' },
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ─────────────────────────────────────────────
// SUPPLIER: Bulk upload from CSV or XLSX
// POST /api/products/bulk-upload
// ─────────────────────────────────────────────
exports.bulkUploadProducts = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please upload a CSV or XLSX file' });
    try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        let rows = [];

        // ── Subscription Check for Bulk Upload and Quota ──
        const User = require('../models/User');
        const user = await User.findById(req.user._id).populate('subscription_plan');
        const plan = user?.subscription_plan;
        if (user.role === 'supplier') {
            if (!plan) {
                if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(403).json({ message: 'Please subscribe to a plan to perform bulk uploads.' });
            }
            if (!plan.features.some(f => f.toLowerCase().includes('bulk'))) {
                // If it doesn't explicitly mention bulk, just allow it if limits are okay, or block?
                // Let's block if plan doesn't have bulk upload feature and it's free tier. 
                if (plan.level < 2) {
                    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                    return res.status(403).json({ message: 'Bulk upload is only available for premium plans.' });
                }
            }
        }

        if (ext === '.xlsx' || ext === '.xls') {
            const wb = XLSX.readFile(req.file.path);
            const ws = wb.Sheets[wb.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(ws);
        } else {
            // CSV: read file synchronously through xlsx (universal reader)
            const wb = XLSX.readFile(req.file.path, { type: 'file', raw: false });
            const ws = wb.Sheets[wb.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(ws);
        }

        // Limit Check
        if (user.role === 'supplier' && plan && plan.max_products !== -1 && plan.max_products !== 0) {
            const currentCount = await Product.countDocuments({ supplier: user._id });
            if (currentCount + rows.length > plan.max_products) {
                if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(403).json({ message: `Bulk upload rejected: Total products would exceed your plan limit of ${plan.max_products}.` });
            }
        }

        // Resolve category titles → IDs in one batch
        const categoryTitles = [...new Set(rows.map(r => r.category).filter(Boolean))];
        const categories = await Category.find({ title: { $in: categoryTitles } }).select('_id title');
        const catMap = Object.fromEntries(categories.map(c => [c.title.toLowerCase(), c._id]));

        const products = [];
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row.name || !row.price) { errors.push(`Row ${i + 2}: missing name or price`); continue; }
            const catId = catMap[String(row.category || '').toLowerCase()];
            if (!catId) { errors.push(`Row ${i + 2}: category "${row.category}" not found`); continue; }

            products.push({
                name: String(row.name),
                description: String(row.description || ''),
                category: catId,
                sku: row.sku || '',
                moq: parseInt(row.moq) || 1,
                currency: row.currency || 'USD',
                countInStock: parseInt(row.stock) || 0,
                sample_available: String(row.sample_available).toLowerCase() === 'true' || row.sample_available === 1,
                sample_price: parseFloat(row.sample_price) || 0,
                price_tiers: [{ min_quantity: parseInt(row.moq) || 1, price: parseFloat(row.price) }],
                status: 'draft',
                approval_status: 'pending',
                supplier: req.user._id
            });
        }

        const inserted = products.length > 0 ? await Product.insertMany(products) : [];
        fs.unlinkSync(req.file.path);

        res.status(201).json({
            message: `${inserted.length} products uploaded as drafts.`,
            inserted: inserted.length,
            skipped: errors.length,
            errors
        });
    } catch (err) {
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Error processing file: ' + err.message });
    }
};

// ─────────────────────────────────────────────
// SUPPLIER: Export own products to XLSX
// GET /api/products/export
// ─────────────────────────────────────────────
exports.exportProducts = async (req, res) => {
    try {
        const products = await Product.find({ supplier: req.user._id })
            .populate('category', 'title')
            .sort({ createdAt: -1 });

        const rows = products.map(p => ({
            name: p.name,
            description: p.description,
            category: p.category?.title || '',
            sku: p.sku,
            moq: p.moq,
            stock: p.countInStock,
            currency: p.currency,
            price: p.main_price || (p.price_tiers?.[0]?.price) || 0,
            status: p.status,
            approval_status: p.approval_status,
            sample_available: p.sample_available ? 'true' : 'false',
            sample_price: p.sample_price,
            created_at: p.createdAt?.toISOString().split('T')[0]
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="my-products.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// ADMIN: Export ALL products to XLSX
// GET /api/products/admin/export
// ─────────────────────────────────────────────
exports.exportAllProductsAdmin = async (req, res) => {
    try {
        const products = await Product.find({})
            .populate('category', 'title')
            .populate('supplier', 'company_name email first_name last_name')
            .sort({ createdAt: -1 });

        const rows = products.map(p => ({
            name: p.name,
            description: p.description,
            supplier: p.supplier?.company_name || `${p.supplier?.first_name} ${p.supplier?.last_name}` || 'N/A',
            supplier_email: p.supplier?.email || 'N/A',
            category: p.category?.title || '',
            sku: p.sku,
            moq: p.moq,
            stock: p.countInStock,
            currency: p.currency,
            price: p.main_price || (p.price_tiers?.[0]?.price) || 0,
            status: p.status,
            approval_status: p.approval_status,
            sample_available: p.sample_available ? 'true' : 'false',
            sample_price: p.sample_price,
            created_at: p.createdAt?.toISOString().split('T')[0]
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'All_Products');

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="platform-products.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// BUYER: Request a sample for a product
// POST /api/products/:id/request-sample
// ─────────────────────────────────────────────
exports.requestSample = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('supplier', 'first_name last_name email');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (!product.sample_available) return res.status(400).json({ message: 'Sample not available for this product' });

        const { shipping_address, note } = req.body;

        // In production, send an email to the supplier here
        // For now, we log and return success
        res.status(201).json({
            success: true,
            message: 'Sample request submitted. The supplier will contact you shortly.',
            product_name: product.name,
            sample_price: product.sample_price,
            supplier_name: `${product.supplier?.first_name} ${product.supplier?.last_name}`
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// INTERNAL: Decrement product stock after order
// Called after successful payment verification
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// PUBLIC: Search by image
// POST /api/products/search-image
// ─────────────────────────────────────────────
exports.searchByImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded.' });
        }

        let matchedKeywords = [];

        // Try AI Vision based search first if API key is available
        const SiteSetting = require('../models/SiteSetting');
        const settings = await SiteSetting.findOne();
        const aiKey = settings?.ai_api_key;

        if (aiKey && fs.existsSync(req.file.path)) {
            try {
                const axios = require('axios');
                const base64Image = fs.readFileSync(req.file.path, { encoding: 'base64' });
                const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: 'Analyze this image and return only 1-2 most relevant product keywords for an e-commerce search. Space separated, no punctuation.' },
                                { type: 'image_url', image_url: { url: `data:${req.file.mimetype};base64,${base64Image}` } }
                            ]
                        }
                    ],
                    max_tokens: 30
                }, {
                    headers: { 'Authorization': `Bearer ${aiKey}` }
                });
                const aiResult = aiResponse.data.choices[0].message.content.trim().toLowerCase();
                matchedKeywords = aiResult.split(/\s+/).filter(k => k.length > 2);
                console.log('AI Image Search Keywords:', matchedKeywords);
            } catch (e) {
                console.error("OpenAI Image Vision call failed:", e.response?.data || e.message);
            }
        }

        // Fallback to filename based heuristic if AI fails or not available
        if (matchedKeywords.length === 0) {
            const filename = (req.file.originalname || '').toLowerCase();
            const commonKeywords = ['watch', 'phone', 'shirt', 'dress', 'machinery', 'tool', 'bag', 'shoe', 'electronic', 'home', 'kurta', 'set', 'women', 'apparel', 'textile', 'toy', 'toys', 'car', 'bike', 'laptop', 'jewelry', 'saree'];
            matchedKeywords = commonKeywords.filter(k => filename.includes(k));
        }

        // Removed the hardcoded 'saree' fallback. If it can't identify the image, it should accurately return 0 products.

        let seedProduct = null;

        // 1. Try to find a "Seed" product based on keywords
        if (matchedKeywords.length > 0) {
            seedProduct = await Product.findOne({
                status: 'active',
                approval_status: 'approved',
                countInStock: { $gt: 0 },
                $or: matchedKeywords.map(k => ({
                    $or: [
                        { name: { $regex: k, $options: 'i' } },
                        { description: { $regex: k, $options: 'i' } }
                    ]
                }))
            }).sort({ updatedAt: -1 });
        }

        // 2. ONLY SHOW MATCH PRODUCTS OTHERWISE NO RESULT FOUND SHOW
        if (!seedProduct) {
            return res.json({
                success: true,
                products: [],
                total: 0,
                image_url: `/uploads/search/${req.file.filename}`,
                message: "No visual matches found for this image."
            });
        }

        // 3. Find other products that actually MATCH the detected keywords
        const products = await Product.find({
            status: 'active',
            approval_status: 'approved',
            countInStock: { $gt: 0 },
            _id: { $ne: seedProduct._id },
            $or: matchedKeywords.map(k => ({
                $or: [
                    { name: { $regex: k, $options: 'i' } },
                    { description: { $regex: k, $options: 'i' } }
                ]
            }))
        })
            .limit(15)
            .sort({ updatedAt: -1 });

        // Combined results
        const allProducts = [seedProduct, ...products];

        // Simulate similarity scores for a premium feel (0.80 to 0.99)
        const results = allProducts.map((p, index) => ({
            ...p.toObject(),
            similarity_score: (1.0 - (index * 0.012) - (Math.random() * 0.05)).toFixed(2)
        }));

        res.json({
            success: true,
            products: results,
            total: results.length,
            image_url: `/uploads/search/${req.file.filename}`,
            detected_category: seedProduct.category
        });
    } catch (error) {
        console.error('searchByImage error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.decrementProductStock = async (orderItems) => {
    for (const item of orderItems) {
        if (item.product_id) {
            const product = await Product.findById(item.product_id);
            if (product && product.countInStock !== -1) {
                product.countInStock = Math.max(0, product.countInStock - item.quantity);
                await product.save();
            }
        }
    }
};

// ─────────────────────────────────────────────
// BUYER/AI: AI Sourcing Search with usage tracking
// GET /api/products/ai-sourcing
// ─────────────────────────────────────────────
exports.aiSourcingSearch = async (req, res) => {
    try {
        const { keyword, limit = 3 } = req.query;
        if (!req.user) return res.status(401).json({ message: 'Auth required' });

        const User = require('../models/User');
        const user = await User.findById(req.user._id).populate('subscription_plan');

        // Handle buyer limits vs supplier limits
        const plan = user?.subscription_plan;
        const maxTasks = plan ? (plan.max_ai_tasks || 5) : 5; // Default 5 free tasks

        // Reset tasks if month has passed
        const now = new Date();
        const resetDate = new Date(user.ai_tasks_reset_date || user.createdAt);
        resetDate.setMonth(resetDate.getMonth() + 1);

        if (now > resetDate) {
            user.ai_tasks_count = 0;
            user.ai_tasks_reset_date = now;
        }

        if (maxTasks !== -1 && user.ai_tasks_count >= maxTasks) {
            return res.status(403).json({
                message: `AI Task limit reached. You get ${maxTasks} free requests per month. Please upgrade your account.`,
                limitReached: true
            });
        }

        let refinedKeyword = keyword;
        const SiteSetting = require('../models/SiteSetting');
        const settings = await SiteSetting.findOne();
        const aiKey = settings?.ai_api_key;

        if (aiKey) {
            try {
                const axios = require('axios');
                const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a sourcing assistant. Extract ONLY the 2-3 most important product keywords for a database text-search, space separated. If standard question, just extract keywords.' },
                        { role: 'user', content: keyword }
                    ],
                    max_tokens: 30
                }, {
                    headers: { 'Authorization': `Bearer ${aiKey}` }
                });
                refinedKeyword = aiResponse.data.choices[0].message.content.trim() || keyword;
                refinedKeyword = refinedKeyword.replace(/["']/g, '');
            } catch (e) {
                console.error("OpenAI call failed", e.response?.data || e.message);
            }
        }

        // Perform search
        const query = { status: 'active', approval_status: 'approved', countInStock: { $gt: 0 } };
        if (refinedKeyword) query.$text = { $search: refinedKeyword };

        const products = await Product.find(query)
            .populate('supplier', 'company_name is_verified')
            .limit(parseInt(limit))
            .sort({ isPromoted: -1, isPremium: -1 });

        // Increment count
        user.ai_tasks_count = (user.ai_tasks_count || 0) + 1;
        await user.save();

        res.json({ products, remainingTasks: maxTasks === -1 ? 'unlimited' : maxTasks - user.ai_tasks_count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUBLIC: Worldwide / Deep Search
// GET /api/products/worldwide-search
// Returns products + dynamically-generated attribute chips from product names
// ─────────────────────────────────────────────
exports.searchWorldwide = async (req, res) => {
    try {
        const {
            keyword, category_id, min_price, max_price, min_moq,
            verified_only, country, attr, quick_filter,
            sort_by, page = 1, limit = 20
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const baseQuery = { status: 'active', approval_status: 'approved', countInStock: { $gt: 0 } };

        if (keyword) baseQuery.$text = { $search: keyword };

        if (category_id && category_id !== 'undefined') {
            const allCategoryIds = await getChildCategoryIds(category_id);
            baseQuery.category = { $in: allCategoryIds };
        }

        // Attribute chip filter — narrow search to product names containing the attr word
        if (attr) {
            baseQuery.name = { $regex: attr, $options: 'i' };
            delete baseQuery.$text;
        }

        if (min_price || max_price) {
            baseQuery.main_price = {};
            if (min_price) baseQuery.main_price.$gte = parseFloat(min_price);
            if (max_price) baseQuery.main_price.$lte = parseFloat(max_price);
        }

        if (min_moq) baseQuery.moq = { $lte: parseInt(min_moq) };

        const pipeline = [{ $match: baseQuery }];

        pipeline.push({ $lookup: { from: 'users', localField: 'supplier', foreignField: '_id', as: 'supplier_info' } });
        pipeline.push({ $unwind: '$supplier_info' });
        pipeline.push({ $lookup: { from: 'subscriptionplans', localField: 'supplier_info.subscription_plan', foreignField: '_id', as: 'supplier_info.subscription_plan_info' } });
        pipeline.push({ $unwind: { path: '$supplier_info.subscription_plan_info', preserveNullAndEmptyArrays: true } });

        // Join company info for advanced filters
        pipeline.push({ $lookup: { from: 'companies', localField: 'supplier', foreignField: 'user_id', as: 'company_info' } });
        pipeline.push({ $unwind: { path: '$company_info', preserveNullAndEmptyArrays: true } });

        if (verified_only === 'true' || quick_filter === 'verified') {
            pipeline.push({ $match: { 'supplier_info.is_verified': true } });
        }

        if (country) {
            pipeline.push({
                $match: {
                    $or: [
                        { 'supplier_info.country_code': country.toUpperCase() },
                        { 'company_info.country': { $regex: country, $options: 'i' } }
                    ]
                }
            });
        }

        // Quick Filters
        if (quick_filter === 'moq5') pipeline.push({ $match: { moq: { $lte: 5 } } });
        if (quick_filter === 'local_stock') pipeline.push({ $match: { countInStock: { $gt: 0 } } });
        if (quick_filter === 'trade_assurance') pipeline.push({ $match: { 'supplier_info.is_verified': true } }); // Assume verified suppliers have trade assurance
        if (quick_filter === 'exp5yr') {
            const fiveYearsAgo = new Date();
            fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
            pipeline.push({ $match: { 'supplier_info.createdAt': { $lte: fiveYearsAgo } } });
        }
        if (quick_filter === 'rating45') pipeline.push({ $match: { rating: { $gte: 4.5 } } });

        pipeline.push({ $addFields: { isPremium: { $cond: [{ $ifNull: ['$supplier_info.subscription_plan', false] }, 1, 0] } } });

        let sortObj = { isPromoted: -1, isPremium: -1, ppc_bid: -1, createdAt: -1 };
        if (sort_by === 'price_asc') sortObj = { main_price: 1 };
        else if (sort_by === 'price_desc') sortObj = { main_price: -1 };
        else if (sort_by === 'rating') sortObj = { rating: -1 };

        pipeline.push({ $sort: sortObj });

        // Count before pagination
        const countResult = await Product.aggregate([...pipeline, { $count: 'total' }]);
        const total = countResult.length > 0 ? countResult[0].total : 0;

        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });
        pipeline.push({ $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category_info' } });
        pipeline.push({ $unwind: { path: '$category_info', preserveNullAndEmptyArrays: true } });

        const products = await Product.aggregate(pipeline);

        // ── Generate dynamic attribute chips from product names ──
        let attributes = [];
        if (keyword && products.length > 0) {
            const nameBag = products.map(p => p.name).join(' ').toLowerCase();
            const words = nameBag.split(/\s+/);
            const stopWords = new Set([
                'and', 'or', 'for', 'the', 'a', 'an', 'with', 'of', 'in', 'on', 'to', 'at',
                'from', 'by', 'as', 'is', 'are', 'was', 'be', 'it', 'its', 'this', 'that',
                'high', 'quality', 'new', 'style', 'hot', 'sale', 'cheap', 'best', 'top',
                'product', 'wholesale', 'fashion', 'luxury', 'design', 'custom', 'set',
                'type', 'price', 'brand', 'good', 'free', 'steel', 'color', 'size',
                keyword.toLowerCase()
            ]);

            const freq = {};
            for (const w of words) {
                const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
                if (!clean || clean.length < 3 || stopWords.has(clean)) continue;
                freq[clean] = (freq[clean] || 0) + 1;
            }

            attributes = Object.entries(freq)
                .filter(([, count]) => count >= 1)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 12)
                .map(([word]) => {
                    const kwCap = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                    const wordCap = word.charAt(0).toUpperCase() + word.slice(1);
                    return `${kwCap} ${wordCap}`;
                });
        }

        const quickFilters = [
            { key: 'local_stock', label: 'Local stock' },
            { key: 'trade_assurance', label: 'Trade Assurance' },
            { key: 'moq5', label: 'MOQ ≤ 5' },
            { key: 'verified', label: 'Verified Supplier' },
            { key: 'exp5yr', label: '5+ Years Supplier Exp.' },
            { key: 'rating45', label: '4.5+ Supplier Rating' },
        ];

        res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / limit), attributes, quickFilters });
    } catch (error) {
        console.error('searchWorldwide error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUBLIC: Top Ranking Products grouped by category
// GET /api/products/top-ranking
// ─────────────────────────────────────────────
exports.getTopRankingByCategory = async (req, res) => {
    try {
        const { sort_by = 'ranking', limit_per_cat = 3, max_cats = 30, category_id } = req.query;

        // Build sort obj
        let sortObj;
        switch (sort_by) {
            case 'rating': sortObj = { rating: -1, numReviews: -1 }; break;
            case 'recent': sortObj = { createdAt: -1 }; break;
            case 'price_asc': sortObj = { main_price: 1 }; break;
            default: sortObj = { ranking_score: -1, numOrders: -1, views: -1, rating: -1 };
        }

        // 1. Get ALL parent categories first (for the filter list)
        const allParentCats = await Category.find({ status: 'active', parent: null })
            .select('_id title icon')
            .sort({ title: 1 });

        // 2. Determine which parent categories to process
        let targetParentCats = allParentCats;
        if (category_id && category_id !== 'undefined') {
            targetParentCats = allParentCats.filter(c => c._id.toString() === category_id);
        }

        // 3. Get all active/approved products with ranking data
        const products = await Product.aggregate([
            { $match: { status: 'active', approval_status: 'approved', countInStock: { $gt: 0 } } },
            { $lookup: { from: 'users', localField: 'supplier', foreignField: '_id', as: 'supplier_info' } },
            { $unwind: { path: '$supplier_info', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'subscriptionplans', localField: 'supplier_info.subscription_plan', foreignField: '_id', as: 'supplier_info.subscription_plan_info' } },
            { $unwind: { path: '$supplier_info.subscription_plan_info', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category_info' } },
            { $unwind: { path: '$category_info', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    computed_rank: {
                        $add: [
                            { $ifNull: ['$ranking_score', 0] },
                            { $multiply: [{ $ifNull: ['$numOrders', 0] }, 3] },
                            { $multiply: [{ $ifNull: ['$views', 0] }, 0.5] },
                            { $multiply: [{ $ifNull: ['$rating', 0] }, 20] },
                            { $multiply: [{ $ifNull: ['$numReviews', 0] }, 2] },
                        ]
                    }
                }
            },
            { $sort: sortObj.ranking_score ? { computed_rank: -1 } : sortObj },
        ]);

        // 4. Group products by parent category
        const parentGroups = [];
        for (const parentCat of targetParentCats) {
            const childIds = await getChildCategoryIds(parentCat._id);
            const childIdStrs = childIds.map(id => id.toString());

            const catProducts = products.filter(p => {
                const catId = p.category_info?._id?.toString() || p.category?.toString();
                return catId && childIdStrs.includes(catId);
            });

            if (catProducts.length === 0) continue;

            parentGroups.push({
                _id: parentCat._id,
                title: parentCat.title,
                icon: parentCat.icon,
                products: catProducts.slice(0, parseInt(limit_per_cat)),
                totalProducts: catProducts.length,
            });

            if (!category_id && parentGroups.length >= parseInt(max_cats)) break;
        }

        res.json({
            categories: parentGroups,
            allCategories: allParentCats
        });
    } catch (error) {
        console.error('getTopRankingByCategory error:', error);
        res.status(500).json({ message: error.message });
    }
};
