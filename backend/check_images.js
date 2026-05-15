const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        const productColl = mongoose.connection.db.collection('products');
        const categoryColl = mongoose.connection.db.collection('categories');

        const products = await productColl.find({}).limit(5).toArray();
        console.log('Sample Products:');
        products.forEach(p => console.log({ name: p.name, images: p.images, main_image: p.main_image }));

        const categories = await categoryColl.find({}).limit(5).toArray();
        console.log('\nSample Categories:');
        categories.forEach(c => console.log({ title: c.title, image: c.image }));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
