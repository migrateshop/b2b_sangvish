const mongoose = require('mongoose');
require('dotenv').config();

const Page = require('./models/Page');
const ShippingRule = require('./models/ShippingRule');
const Role = require('./models/Role');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_demo';

const seedAdminDemo = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB for seeding demo data');

        // Seed Roles if empty
        const roleCount = await Role.countDocuments();
        if (roleCount === 0) {
            await Role.create([
                { name: 'admin', description: 'System Administrator', permissions: ['all'] },
                { name: 'buyer', description: 'Product Buyer', permissions: ['browse', 'buy'] },
                { name: 'supplier', description: 'Product Supplier', permissions: ['sell', 'manage_products'] }
            ]);
            console.log('Seeded 3 Roles');
        }

        // Seed CMS Pages if empty
        const pageCount = await Page.countDocuments();
        if (pageCount === 0) {
            await Page.create([
                { 
                    title: 'About Us', 
                    slug: 'about-us', 
                    content: '<h1>About Our B2B Marketplace</h1><p>We connect global buyers and suppliers.</p>', 
                    isPublished: true,
                    metaDescription: 'Learn more about our platform.'
                },
                { 
                    title: 'Privacy Policy', 
                    slug: 'privacy-policy', 
                    content: '<h1>Privacy Policy</h1><p>Your data is safe with us.</p>', 
                    isPublished: true,
                    metaDescription: 'Our commitment to your privacy.'
                },
                { 
                    title: 'Terms and Conditions', 
                    slug: 'terms-and-conditions', 
                    content: '<h1>Terms and Conditions</h1><p>Usage rules for the platform.</p>', 
                    isPublished: true,
                    metaDescription: 'Terms of service.'
                }
            ]);
            console.log('Seeded 3 CMS Pages');
        }

        // Seed Shipping Rules if empty
        const shippingCount = await ShippingRule.countDocuments();
        if (shippingCount === 0 || shippingCount < 5) {
            // Delete existing to refresh with new fields
            await ShippingRule.deleteMany({});
            
            await ShippingRule.create([
                // Country Based
                { country_code: 'US', country_name: 'United States', base_cost: 15, cost_per_kg: 2.5, estimated_days_min: 5, estimated_days_max: 10, carrier: 'UPS Priority', type: 'country' },
                { country_code: 'UK', country_name: 'United Kingdom', base_cost: 20, cost_per_kg: 3.0, estimated_days_min: 7, estimated_days_max: 12, carrier: 'DHL Global', type: 'country' },
                { country_code: 'IN', country_name: 'India', base_cost: 5, cost_per_kg: 1.2, estimated_days_min: 3, estimated_days_max: 7, carrier: 'BlueDart', type: 'country' },
                { country_code: 'CN', country_name: 'China', base_cost: 10, cost_per_kg: 1.5, estimated_days_min: 2, estimated_days_max: 5, carrier: 'SF Express', type: 'country' },
                { country_code: 'PK', country_name: 'Pakistan', base_cost: 10, cost_per_kg: 1.8, estimated_days_min: 3, estimated_days_max: 7, carrier: 'Local Post', type: 'country' },
                
                // Distance Based (Local/Regional)
                { carrier: 'Local Warehouse Pickup', base_cost: 0, cost_per_km: 0, min_distance: 0, max_distance: 50, estimated_days_min: 1, estimated_days_max: 2, type: 'distance', country_code: 'ALL', country_name: 'Local Zone' },
                { carrier: 'Rapid Courier (City)', base_cost: 5, cost_per_km: 0.1, min_distance: 51, max_distance: 500, estimated_days_min: 1, estimated_days_max: 3, type: 'distance', country_code: 'ALL', country_name: 'Regional Zone' },
                { carrier: 'Eco Freight (Long Haul)', base_cost: 25, cost_per_km: 0.05, min_distance: 501, max_distance: 10000, estimated_days_min: 5, estimated_days_max: 15, type: 'distance', country_code: 'ALL', country_name: 'Long Haul Zone' }
            ]);
            console.log('Seeded 8 Shipping Rules (Country + Distance)');
        }

        console.log('Demo data seeding finished.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedAdminDemo();
