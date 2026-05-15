const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

async function fix() {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        const db = client.db('alibaba_demo');
        const usersCol = db.collection('users');
        
        const allUsers = await usersCol.find({}).toArray();
        console.log(`Analyzing ${allUsers.length} users...`);
        
        let fixedCount = 0;
        for (const user of allUsers) {
            let update = {};
            
            // If roles is missing or not an array, create it from 'role' or default to ['buyer']
            if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
                const legacyRole = user.role || 'buyer';
                update.roles = [legacyRole];
            }
            
            if (Object.keys(update).length > 0) {
                await usersCol.updateOne({ _id: user._id }, { $set: update });
                fixedCount++;
            }
        }
        
        console.log(`Successfully repaired ${fixedCount} users.`);
        
        const counts = await usersCol.aggregate([
            { $unwind: "$roles" },
            { $group: { _id: "$roles", count: { $sum: 1 } } }
        ]).toArray();
        console.log("Stats after fix:", counts);
        
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
        process.exit(0);
    }
}

fix();
