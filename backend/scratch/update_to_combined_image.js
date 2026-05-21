const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

require('../models/HomepageSection');
const HomepageSection = mongoose.model('HomepageSection');

const artifactsDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\794c3113-af34-4208-9164-5b2791cf2094';
const uploadsHomepageDir = path.join(__dirname, '../uploads/homepage');

const srcFile = 'mobile_app_promo_combined.png';
const destFile = 'mobile_app_promo_combined.png';

const run = async () => {
    try {
        console.log('1. Copying combined mobile promo image...');
        const srcPath = path.join(artifactsDir, srcFile);
        const destPath = path.join(uploadsHomepageDir, destFile);

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Successfully copied ${srcFile} to ${destPath}`);
        } else {
            console.error(`Source file not found: ${srcPath}`);
            process.exit(1);
        }

        console.log('\n2. Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        console.log('MongoDB connection established.');

        console.log('\n3. Updating app_promo homepage section image in DB...');
        const appSection = await HomepageSection.findOneAndUpdate(
            { id_name: 'app_promo' },
            { data: { image: '/uploads/homepage/mobile_app_promo_combined.png' } },
            { new: true }
        );
        console.log('Updated app_promo image path in DB:', appSection && appSection.data ? appSection.data.image : 'NOT FOUND');

        console.log('\n✅ Database update complete!');
        await mongoose.connection.close();
    } catch (err) {
        console.error('Error during execution:', err);
    }
};

run();
