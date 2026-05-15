const mongoose = require('mongoose');
require('dotenv').config();

const connectionString = process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_demo';

async function check() {
    try {
        await mongoose.connect(connectionString);
        console.log('Connected to DB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        const counts = {};

        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            counts[col.name] = count;
        }

        console.log('COLLECTION COUNTS:');
        console.log(JSON.stringify(counts, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
