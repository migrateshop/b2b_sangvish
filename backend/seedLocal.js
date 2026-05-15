const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Company = require('./models/Company');

const seedLocal = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to local Mongo DB');

        // Clear existing
        await User.deleteMany();
        await Category.deleteMany();
        await Product.deleteMany();
        await Company.deleteMany();

        // 1. Create Users
        const supplier = await User.create({
            first_name: 'John',
            last_name: 'Doe',
            email: 'supplier@alibaba.com',
            password: 'password123', // Not hashed, but for local demo UI testing it's fine unless login needed
            role: 'supplier',
            phone_number: '1234567890',
            country_code: 'CN',
            is_verified: true,
            business_type: 'Manufacturer'
        });

        const buyer = await User.create({
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'buyer@buyer.com',
            password: 'password123',
            role: 'buyer',
            country_code: 'US'
        });

        // 2. Create Company
        const company = await Company.create({
            user_id: supplier._id,
            company_name: 'Tech Innovators Co., Ltd.',
            business_type: 'Manufacturer, Trading Company',
            country: 'China',
            address: '123 Industrial Park, Shenzhen',
            website: 'https://techinnovators.com',
            description: 'We are a leading tech hardware manufacturer with 10 years of experience.',
            logo: 'https://via.placeholder.com/150/1e3a8a/FFFFFF?text=TIC',
            verification_status: 'verified'
        });

        // 3. Create Categories
        const catElectronics = await Category.create({ title: 'Consumer Electronics', slug: 'electronics', icon: 'fa-tv', description: 'Tech goods', status: 'active' });
        const catApparel = await Category.create({ title: 'Apparel', slug: 'apparel', icon: 'fa-tshirt', description: 'Clothing', status: 'active' });

        // 4. Create Products
        await Product.create({
            name: 'Wholesale High Speed USB Flash Drives 64GB 128GB Custom Logo',
            description: 'High quality flash drives with your logo printed. Perfect for corporate gifts.',
            category: catElectronics._id,
            sku: 'FD-101',
            moq: 100,
            unit: 'Pieces',
            currency: 'USD',
            main_price: 2.50,
            oldPrice: 3.50,
            price_tiers: [
                { min_quantity: 100, max_quantity: 499, price: 2.50 },
                { min_quantity: 500, max_quantity: 999, price: 2.20 },
                { min_quantity: 1000, price: 1.99 }
            ],
            variants: [{ name: 'Capacity', value: '64GB', price_modifier: 0 }, { name: 'Capacity', value: '128GB', price_modifier: 1.5 }],
            images: ['https://via.placeholder.com/600/CCCCCC/666666?text=Flash+Drive', 'https://via.placeholder.com/600/999999/FFFFFF?text=Back+View'],
            main_image: 'https://via.placeholder.com/600/CCCCCC/666666?text=Flash+Drive',
            countInStock: 5000,
            status: 'active',
            approval_status: 'approved',
            supplier: supplier._id,
            rating: 4.8,
            numReviews: 124
        });

        await Product.create({
            name: 'Men Premium Cotton T-Shirt Blank Tees Wholesale',
            description: '100% Cotton soft tees in various colors.',
            category: catApparel._id,
            sku: 'TS-200',
            moq: 50,
            unit: 'Pieces',
            currency: 'USD',
            main_price: 4.00,
            oldPrice: null,
            price_tiers: [
                { min_quantity: 50, max_quantity: 499, price: 4.00 },
                { min_quantity: 500, price: 3.50 }
            ],
            images: ['https://via.placeholder.com/600/CCCCCC/666666?text=Blank+Tee'],
            main_image: 'https://via.placeholder.com/600/CCCCCC/666666?text=Blank+Tee',
            countInStock: 2000,
            status: 'active',
            approval_status: 'approved',
            supplier: supplier._id,
            rating: 4.5,
            numReviews: 45
        });

        const Language = require('./models/Language');
        const Currency = require('./models/Currency');

        await Language.deleteMany();
        await Currency.deleteMany();

        await Language.create([
            { name: 'English', code: 'en', is_active: true, is_default: true },
            { name: 'Chinese', code: 'zh', is_active: true }
        ]);

        await Currency.create([
            { code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate: 1, is_active: true, is_default: true },
            { code: 'EUR', name: 'Euro', symbol: '€', exchange_rate: 0.92, is_active: true }
        ]);

        console.log('Local DB seeded Successfully!');
        console.log('Supplier ID to browse:', supplier._id.toString());
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedLocal();
