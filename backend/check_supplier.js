const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        console.log('--- COMPANIES ---');
        const companies = await db.collection('companies').find({}).toArray();
        for (const c of companies) {
            console.log(`Company ID: ${c._id.toString()} | Name: ${c.company_name} | User ID (supplier): ${c.user_id?.toString()}`);
        }

        console.log('\n--- SUPPLIER USERS ---');
        const users = await db.collection('users').find({ role: 'supplier' }).toArray();
        for (const u of users) {
            console.log(`User ID: ${u._id.toString()} | Company Name: ${u.company_name} | Email: ${u.email}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
