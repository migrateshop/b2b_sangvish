const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const approveAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const result = await Product.updateMany(
            {},
            { approval_status: 'approved', status: 'active' }
        );

        console.log(`Approved ${result.modifiedCount} products.`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

approveAll();
