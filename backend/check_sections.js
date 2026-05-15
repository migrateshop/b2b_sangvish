const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Product = require('./models/Product');
        const User = require('./models/User');

        const sections = ['Top Deals', 'Top Ranking', 'New Arrivals'];
        for (const section of sections) {
            const count = await Product.countDocuments({ section });
            console.log(`Section "${section}": ${count} products`);
        }

        const showcaseCount = await Product.countDocuments({ isFeatured: true });
        console.log(`Showcase (isFeatured): ${showcaseCount} products`);

        const supplierCount = await User.countDocuments({ role: 'supplier' });
        console.log(`Suppliers: ${supplierCount}`);

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkProducts();
