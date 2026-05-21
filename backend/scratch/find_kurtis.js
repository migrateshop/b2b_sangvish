const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');

async function findKurtis() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        console.log('Connected to MongoDB');

        const products = await Product.find({
            $or: [
                { name: { $regex: /kurti/i } },
                { description: { $regex: /kurti/i } }
            ]
        });

        console.log(`Found ${products.length} products matching 'kurti':`);
        products.forEach(p => {
            console.log(`ID: ${p._id}`);
            console.log(`Name: ${p.name}`);
            console.log(`Slug: ${p.slug}`);
            console.log(`Images: ${JSON.stringify(p.images)}`);
            console.log(`SubImages: ${JSON.stringify(p.sub_images)}`);
            console.log(`Category: ${p.category}`);
            console.log(`-----------------------------`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findKurtis();
