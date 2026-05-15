const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'e:/alibaba_demo/backend/.env' });

async function checkUser() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        console.log('Connecting to MongoDB via native driver...');
        await client.connect();
        console.log('Connected.');

        const db = client.db();
        const users = db.collection('users');

        const email = 'supplier@gmail.com';
        const user = await users.findOne({ email });

        if (user) {
            console.log('User found:');
            console.log('Email:', user.email);
            console.log('Roles:', user.roles);
            console.log('Status:', user.status);
            console.log('Company Name:', user.company_name);
        } else {
            console.log(`User ${email} not found.`);
            const allUsers = await users.find({}).limit(10).toArray();
            console.log('Sample users:');
            allUsers.forEach(u => console.log(`- ${u.email} [${u.roles}]`));
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

checkUser();
