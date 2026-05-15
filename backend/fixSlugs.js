require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const products = await Product.find({});
        console.log(`Found ${products.length} products`);

        let count = 0;
        for (let p of products) {
            if (!p.slug) {
                p.markModified('name');
                await p.save();
                count++;
                console.log(`Generated slug for ${p.name}: ${p.slug}`);
            }
        }

        console.log(`Finished generating slugs for ${count} products.`);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
