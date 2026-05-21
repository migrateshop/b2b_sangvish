const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');

async function updateDb() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        console.log('Connected to MongoDB');

        // Update Compressor
        const comp = await Product.findById('664c7e6b0000000000000030');
        if (comp) {
            comp.images = [
                "/uploads/products/prod_664c7e6b0000000000000030_sub_0.jpg",
                "/uploads/products/prod_664c7e6b0000000000000030_sub_1.jpg",
                "/uploads/products/prod_664c7e6b0000000000000030_sub_2.jpg"
            ];
            await comp.save();
            console.log('Updated Air Compressor sub-images');
        } else {
            console.log('Air Compressor not found');
        }

        // Update Water Bottle
        const bottle = await Product.findById('664c7e6b000000000000003b');
        if (bottle) {
            bottle.images = [
                "/uploads/products/prod_664c7e6b000000000000003b_sub_0.jpg",
                "/uploads/products/prod_664c7e6b000000000000003b_sub_1.jpg",
                "/uploads/products/prod_664c7e6b000000000000003b_sub_2.jpg"
            ];
            await bottle.save();
            console.log('Updated Water Bottle sub-images');
        } else {
            console.log('Water Bottle not found');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateDb();
