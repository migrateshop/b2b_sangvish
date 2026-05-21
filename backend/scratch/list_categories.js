const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Category = require('../models/Category');

async function listCategories() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        console.log('Connected to MongoDB');

        const categories = await Category.find({}).sort({ level: 1, order: 1 });
        console.log(`Total categories: ${categories.length}`);
        categories.forEach(c => {
            console.log(`- ID: ${c._id}, Title: "${c.title}", Level: ${c.level}, Slug: "${c.slug}", Image: "${c.image}"`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listCategories();
