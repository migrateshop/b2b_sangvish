const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'e:/alibaba_demo/backend/.env' });

async function fixUser() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        console.log('Connecting to MongoDB...');
        await client.connect();
        const db = client.db();
        const users = db.collection('users');

        const email = 'supplier@gmail.com';
        const result = await users.updateOne(
            { email },
            { 
                $set: { 
                    roles: ['supplier'],
                    company_name: 'Supplier Demo Company'
                } 
            }
        );

        if (result.matchedCount > 0) {
            console.log(`Successfully updated ${email} to supplier role.`);
        } else {
            console.log(`User ${email} not found.`);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

fixUser();
