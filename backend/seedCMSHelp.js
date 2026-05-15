const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CMSPage = require('./models/Page');

dotenv.config();

const seedCMS = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_demo');
        console.log('Connected to MongoDB');

        const pages = [
            {
                title: 'For Buyers',
                slug: 'for-buyers',
                content: '<h1>Buyer Help Center</h1><p>Welcome to the buyer guide. Here you can find information on how to source products, contact suppliers, and manage your orders.</p>',
                isPublished: true,
                metaDescription: 'Complete guide for buyers on our platform.'
            },
            {
                title: 'For Suppliers',
                slug: 'for-suppliers',
                content: '<h1>Supplier Help Center</h1><p>Welcome to the supplier guide. Here you can learn how to list products, respond to RFQs, and grow your business on our marketplace.</p>',
                isPublished: true,
                metaDescription: 'Complete guide for suppliers to succeed on our platform.'
            }
        ];

        for (const page of pages) {
            const exists = await CMSPage.findOne({ slug: page.slug });
            if (exists) {
                console.log(`Page ${page.slug} already exists, updating...`);
                await CMSPage.findOneAndUpdate({ slug: page.slug }, page);
            } else {
                console.log(`Creating page ${page.slug}...`);
                await CMSPage.create(page);
            }
        }

        console.log('CMS Seeding complete');
        process.exit();
    } catch (err) {
        console.error('Error seeding CMS:', err);
        process.exit(1);
    }
};

seedCMS();
