const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const BusinessType = require('./models/BusinessType');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        
        const types = [
            { name: 'Manufacturer', status: 'Active' },
            { name: 'Wholesaler', status: 'Active' },
            { name: 'Trading Company', status: 'Active' },
            { name: 'Retailer', status: 'Active' },
            { name: 'Agent', status: 'Active' },
            { name: 'Distributor', status: 'Active' }
        ];

        for (const type of types) {
            await BusinessType.findOneAndUpdate(
                { name: type.name },
                type,
                { upsert: true, new: true }
            );
        }

        console.log('Demo business types added successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
seed();
