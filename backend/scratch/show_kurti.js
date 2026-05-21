const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');

async function showKurti() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        console.log('Connected to MongoDB');

        const p = await Product.findOne({ _id: '664c7e6b000000000000003f' });
        if (p) {
            console.log(JSON.stringify(p, null, 2));
        } else {
            console.log('Kurti not found');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

showKurti();
