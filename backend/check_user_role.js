const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/alibaba_demo/backend/.env' });
const User = require('e:/alibaba_demo/backend/models/User');

async function checkUser() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected.');
        
        const email = 'supplier@gmail.com';
        const user = await User.findOne({ email });
        
        if (user) {
            console.log('User found:');
            console.log('Email:', user.email);
            console.log('Roles:', user.roles);
            console.log('Role (Virtual):', user.role);
            console.log('Status:', user.status);
            console.log('Company Name:', user.company_name);
        } else {
            console.log(`User ${email} not found.`);
            // List some users to see what's there
            const someUsers = await User.find().limit(5);
            console.log('Last 5 users:');
            someUsers.forEach(u => console.log(`- ${u.email} [${u.roles}]`));
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}
checkUser();
