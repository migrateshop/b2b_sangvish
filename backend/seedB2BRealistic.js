const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Company = require('./models/Company');

const seedB2BData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('CONNECTED to Cloud Atlas. Starting B2B Refresh...');

        // 1. Clear OLD 'dummy' products/categories
        // I will keep the supplier user as the anchor
        await Category.deleteMany();
        await Product.deleteMany();

        // 2. Clear Existing Products
        console.log('Cleared existing retail products/categories.');

        // 3. Create professional B2B Categories
        const categoriesData = [
            { title: 'Machinery & Equipment', slug: 'machinery', icon: 'fa-cogs', description: 'Industrial machines, tools, and heavy equipment.', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80' },
            { title: 'Electronics & Accessories', slug: 'electronics', icon: 'fa-plug', description: 'Wholesale consumer electronics and components.', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80' },
            { title: 'Home & Garden', slug: 'home-garden', icon: 'fa-home', description: 'Furniture, lights, and kitchenware in bulk.', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e15ca?w=500&q=80' },
            { title: 'Apparel & Textiles', slug: 'apparel', icon: 'fa-tshirt', description: 'Clothing, fabrics, and wholesale textiles.', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80' },
            { title: 'Beauty & Personal Care', slug: 'beauty', icon: 'fa-sparkles', description: 'Wholesale skincare and cosmetic supplies.', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?w=500&q=80' },
            { title: 'Industrial Tools', slug: 'tools', icon: 'fa-wrench', description: 'Professional tools and manufacturing equipment.', image: 'https://images.unsplash.com/photo-1530124560676-44b291d9096e?w=500&q=80' }
        ];

        const catMap = {};
        for (const cat of categoriesData) {
            const savedCat = await Category.create(cat);
            catMap[cat.slug] = savedCat._id;
        }
        console.log('Created 6 B2B Categories.');

        // 4. Find or Create the Main Wholesale Supplier
        let supplier = await User.findOne({ email: 'wholesale_expert@alibaba.com' });
        if (!supplier) {
            supplier = await User.create({
                first_name: 'Global',
                last_name: 'Wholesale',
                email: 'wholesale_expert@alibaba.com',
                password: 'password123',
                role: 'supplier',
                phone_number: '+86 123 4567 8900',
                country_code: 'CN',
                is_verified: true,
                business_type: 'Manufacturer'
            });

            await Company.create({
                user_id: supplier._id,
                company_name: 'Zhenjiang Industrial Solutions Ltd.',
                business_type: 'Manufacturer, Trading Company',
                country: 'China',
                address: 'Building 7, High-Tech Industrial Park, Zhenjiang',
                website: 'https://zhenjiang-industrial.com',
                description: 'We are a premier global manufacturer and exporter specializing in heavy machinery, solar energy components, and custom manufacturing solutions.',
                logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop&q=80',
                verification_status: 'verified'
            });
        }

        // 5. Generate Professional B2B Products
        const b2bProducts = [
            // MACHINERY
            {
                name: 'Industrial Heavy Duty Air Compressor 10HP for Manufacturing',
                description: 'High pressure tank air compressor. Low noise technology. Includes 2 years warranty and on-site support.',
                category: catMap['machinery'],
                sku: 'ZJ-AC110', moq: 2, unit: 'Sets', main_price: 1200, oldPrice: 1550,
                main_image: 'https://images.unsplash.com/photo-1504917595217-d4dc5f64b321?w=800&q=80',
                tags: ['Machinery', 'Industrial', 'Air Compressor'],
                section: 'Top Deals'
            },
            {
                name: 'Professional Vertical CNC Machining Center VMC-850',
                description: 'Precision machining for metal parts. Advanced Siemens controller system. High speed spindle.',
                category: catMap['machinery'],
                sku: 'ZJ-CNC850', moq: 1, unit: 'Sets', main_price: 24500, oldPrice: 32000,
                main_image: 'https://plus.unsplash.com/premium_photo-1663100650993-455b79d2b274?w=800&q=80',
                tags: ['CNC', 'Metalwork', 'Machinery'],
                section: 'Top Ranking'
            },
            // ELECTRONICS
            {
                name: '400W Monocrystalline PV Solar Panel for Household System',
                description: 'High efficiency solar panels. TUV & CE certified. 25-year performance warranty.',
                category: catMap['electronics'],
                sku: 'ZJ-SP400W', moq: 50, unit: 'Pieces', main_price: 85.50, oldPrice: 120.00,
                main_image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80',
                tags: ['Solar', 'Energy', 'Panel'],
                section: 'Top Deals'
            },
            {
                name: 'Full Color Indoor P2.5 LED Video Wall Stage Screen',
                description: 'High resolution LED display for events and advertising. Ultra-slim cabinet design.',
                category: catMap['electronics'],
                sku: 'ZJ-LEDV25', moq: 10, unit: 'sqm', main_price: 450, oldPrice: 650,
                main_image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
                tags: ['LED', 'Display', 'Advertising'],
                section: 'New Arrivals'
            },
            // HOME & GARDEN (Furniture)
            {
                name: 'Wholesale Modern Ergonometric Mesh Office Chair Bulk order',
                description: 'Premium breathable mesh. Adjustable height and armrests. SGS verified high quality.',
                category: catMap['home-garden'],
                sku: 'ZJ-CH402', moq: 100, unit: 'Pieces', main_price: 32.80, oldPrice: 48.00,
                main_image: 'https://images.unsplash.com/photo-1589363360147-4927cb972c72?w=800&q=80',
                tags: ['Furniture', 'Office', 'Chair'],
                section: 'Top Ranking'
            },
            {
                name: 'Outdoor Waterproof Solar Garden Lawn Lamp 10W-20W',
                description: 'Auto-on sensor lights. IP65 Waterproof rating. Aluminum body for durability.',
                category: catMap['home-garden'],
                sku: 'ZJ-GL10W', moq: 200, unit: 'Pieces', main_price: 12.50, oldPrice: 19.99,
                main_image: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?w=800&q=80',
                tags: ['Gardon', 'Lighting', 'Solar'],
                section: 'New Arrivals'
            },
            // APPAREL
            {
                name: 'Custom Logo 100% Cotton Heavyweight Mens Blank T-shirt',
                description: 'Premium 240gsm cotton. Available in 20 colors. Custom screen printing & embroidery.',
                category: catMap['apparel'],
                sku: 'ZJ-TS001', moq: 100, unit: 'Pieces', main_price: 4.25, oldPrice: 8.50,
                main_image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
                tags: ['Clothing', 'Cotton', 'Tshirt'],
                section: 'Top Deals'
            },
            {
                name: 'Sustainable Recycled Polyester Fabric for Athletic Wear',
                description: 'Eco-friendly breathable fabric. 4-way stretch. Perfect for yoga and fitness apparel.',
                category: catMap['apparel'],
                sku: 'ZJ-FB88', moq: 500, unit: 'Yards', main_price: 2.15, oldPrice: 3.50,
                main_image: 'https://images.unsplash.com/photo-1544441893-675973e31d35?w=800&q=80',
                tags: ['Fabric', 'Textile', 'Activewear'],
                section: 'New Arrivals'
            }
        ];

        for (const p of b2bProducts) {
            // Add B2B Price Tiers
            const tiers = [
                { min_quantity: p.moq, max_quantity: p.moq * 5, price: p.main_price },
                { min_quantity: p.moq * 5 + 1, max_quantity: p.moq * 10, price: p.main_price * 0.9 },
                { min_quantity: p.moq * 10 + 1, price: p.main_price * 0.8 }
            ];

            await Product.create({
                ...p,
                images: [p.main_image],
                price_tiers: tiers,
                countInStock: 10000,
                status: 'active',
                approval_status: 'approved',
                supplier: supplier._id,
                rating: 4.8,
                numReviews: Math.floor(Math.random() * 200) + 50
            });
        }

        console.log(`POPUATED ${b2bProducts.length} REAL B2B WHOLESALE PRODUCTS SUCCESSFULLY!`);
        console.log('Final Database status: READY FOR ALIBABA CLONE DEMO');
        process.exit();

    } catch (err) {
        console.error('B2B Migrations failed:', err);
        process.exit(1);
    }
};

seedB2BData();
