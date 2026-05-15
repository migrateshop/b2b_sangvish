const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const productColl = mongoose.connection.db.collection('products');

        const localProducts = await productColl.find({
            $or: [
                { main_image: { $regex: /uploads/ } },
                { images: { $elemMatch: { $regex: /uploads/ } } }
            ]
        }).toArray();

        console.log(`Found ${localProducts.length} products with local uploads:`);
        localProducts.forEach(p => console.log({ name: p.name, images: p.images, main_image: p.main_image }));

        process.exit();
    } catch (err) {
        process.exit(1);
    }
};

checkDB();
