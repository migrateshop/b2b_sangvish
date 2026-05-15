const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const Category = mongoose.connection.collection('categories');
        try {
            await Category.dropIndex('name_1');
            console.log('Dropped index name_1');
        } catch (e) {
            console.log('Index name_1 not found.');
        }

        try {
            await Category.dropIndex('title_1');
            console.log('Dropped index title_1');
        } catch (e) {
            console.log('Index title_1 not found or already dropped.');
        }

        const Product = mongoose.connection.collection('products');
        try {
            await Product.dropIndex('title_1');
            console.log('Dropped product index title_1');
        } catch (e) {
            console.log('Product index title_1 not found.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixIndexes();
