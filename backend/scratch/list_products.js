const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');

async function listAllProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        console.log('Connected to MongoDB');

        const products = await Product.find({});
        console.log(`Total products: ${products.length}`);
        products.forEach(p => {
            console.log(`- ID: ${p._id}, Name: ${p.name}, Slug: ${p.slug}, Images: ${JSON.stringify(p.images)}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAllProducts();
