const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const products = await Product.find();
        console.log(`Total Products: ${products.length}`);

        console.log('--- Product Details ---');
        products.forEach(p => {
            console.log(` - ${p.name} | Section: ${p.section} | Status: ${p.status} | Approval: ${p.approval_status}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
