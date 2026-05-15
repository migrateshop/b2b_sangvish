const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Company = require('./models/Company');

const fetchDummyData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to local Mongo DB');

        // Optional: clear existing data, or just append
        // Let's create a dummy supplier first if one doesn't exist
        let supplier = await User.findOne({ email: 'global_supplier@alibaba.com' });
        if (!supplier) {
            supplier = await User.create({
                first_name: 'Global',
                last_name: 'Supplier',
                email: 'global_supplier@alibaba.com',
                password: 'password123',
                role: 'supplier',
                phone_number: '1234567890',
                country_code: 'US',
                is_verified: true,
                business_type: 'Distributor/Wholesaler'
            });

            await Company.create({
                user_id: supplier._id,
                company_name: 'Global Trade Hub Ltd.',
                business_type: 'Distributor/Wholesaler',
                country: 'United States',
                address: '456 Commerce Ave, New York',
                website: 'https://globaltradehub.com',
                description: 'Your premium global partner for various electronics and accessories.',
                logo: 'https://via.placeholder.com/150/000000/FFFFFF?text=GTH',
                verification_status: 'verified'
            });
        }

        console.log('Fetching Categories from DummyJSON...');
        const catRes = await fetch('https://dummyjson.com/products/categories');
        const categories = await catRes.json();

        const categoryMap = {}; // Maps slug to MongoDB Category _id

        for (const cat of categories) {
            // DummyJSON sometimes returns strings array, sometimes objects {slug, name}
            const slug = typeof cat === 'string' ? cat : cat.slug;
            const title = typeof cat === 'string' ? cat.charAt(0).toUpperCase() + cat.slice(1) : cat.name;

            let existingCat = await Category.findOne({ slug });
            if (!existingCat) {
                existingCat = await Category.create({
                    title,
                    slug,
                    description: `${title} products category.`,
                    status: 'active'
                });
            }
            categoryMap[slug] = existingCat._id;
        }
        console.log(`Created ${Object.keys(categoryMap).length} categories.`);

        console.log('Fetching Products from DummyJSON...');
        const prodRes = await fetch('https://dummyjson.com/products?limit=50&skip=0');
        const prodData = await prodRes.json();
        const products = prodData.products;

        let addedProducts = 0;

        for (const p of products) {
            const catId = categoryMap[p.category];
            if (!catId) continue; // Category not found locally for some reason

            // Check if product already exists
            const existingProd = await Product.findOne({ sku: `DUMMY-${p.id}` });
            if (!existingProd) {
                // Determine price tiers (wholesale logic)
                const basePrice = p.price;
                const price_tiers = [
                    { min_quantity: 10, max_quantity: 49, price: basePrice * 0.9 },
                    { min_quantity: 50, max_quantity: 99, price: basePrice * 0.8 },
                    { min_quantity: 100, price: basePrice * 0.7 }
                ];

                await Product.create({
                    name: p.title,
                    description: p.description,
                    category: catId,
                    sku: `DUMMY-${p.id}`,
                    moq: 10,
                    unit: 'Pieces',
                    currency: 'USD',
                    main_price: basePrice,
                    oldPrice: basePrice * 1.2, // Simulate discount
                    price_tiers: price_tiers,
                    variants: [],
                    images: p.images || [p.thumbnail],
                    main_image: p.thumbnail,
                    countInStock: p.stock || 1000,
                    status: 'active',
                    approval_status: 'approved',
                    supplier: supplier._id,
                    rating: p.rating || 4.5,
                    numReviews: p.reviews ? p.reviews.length : Math.floor(Math.random() * 100)
                });
                addedProducts++;
            }
        }

        console.log(`Added ${addedProducts} products from DummyJSON.`);
        console.log('Migration Complete.');
        process.exit();
    } catch (err) {
        console.error('Error during data fetch/migration:', err);
        process.exit(1);
    }
};

fetchDummyData();
