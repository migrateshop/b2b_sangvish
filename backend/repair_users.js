require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function repair() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const users = await User.find({});
        console.log(`Checking ${users.length} users`);
        
        for (let user of users) {
            let changed = false;
            
            // Migrate single role field if roles is empty
            if ((!user.roles || user.roles.length === 0) && user.get('role')) {
                user.roles = [user.get('role')];
                changed = true;
            }
            
            // Ensure roles defaults to ['buyer'] if still empty
            if (!user.roles || user.roles.length === 0) {
                user.roles = ['buyer'];
                changed = true;
            }
            
            // Clean up role (singular) field if you wish, or keep for compat
            
            if (changed) {
                await user.save();
                console.log(`Repaired user: ${user.email}`);
            }
        }
        
        console.log('Repair complete');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

repair();
