const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const TrustItem = require('./models/TrustItem');
const Partner = require('./models/Partner');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Seed Trust Items
        await TrustItem.deleteMany({});
        const trustItems = [
            { 
                label: 'Verified Suppliers', 
                translation_key: 'verified_supps',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
                order: 1 
            },
            { 
                label: 'Secure Trade Assurance', 
                translation_key: 'secure_trade_assure',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>',
                order: 2 
            },
            { 
                label: 'Delivery to 190+ Countries', 
                translation_key: 'delivery_to_190',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
                order: 3 
            },
            { 
                label: '24hr Supplier Response', 
                translation_key: '24hr_supplier_res',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>',
                order: 4 
            },
            { 
                label: 'RFQ Posting', 
                translation_key: 'rfq_posting',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M-.01 4h.01" />',
                order: 5 
            },
            { 
                label: '40M+ Products Listed', 
                translation_key: '40m_products',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>',
                order: 6 
            }
        ];
        await TrustItem.insertMany(trustItems);
        console.log('Trust Items seeded');

        // 2. Seed Partner Items
        await Partner.deleteMany({});
        const partners = [
            { name: 'NORDIC', order: 1 },
            { name: 'ELEMENTS', order: 2 },
            { name: 'SPECTRUM', order: 3 },
            { name: 'TRIANGLE', order: 4 },
            { name: 'SYMMETRY', order: 5 }
        ];
        await Partner.insertMany(partners);
        console.log('Partners seeded');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding:', err);
        process.exit(1);
    }
};

seedData();
