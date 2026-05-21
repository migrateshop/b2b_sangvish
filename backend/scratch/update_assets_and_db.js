const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Register models
require('../models/Category');
require('../models/HeroSlide');
require('../models/HomepageSection');

const Category = mongoose.model('Category');
const HeroSlide = mongoose.model('HeroSlide');
const HomepageSection = mongoose.model('HomepageSection');

const artifactsDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\794c3113-af34-4208-9164-5b2791cf2094';
const uploadsHomepageDir = path.join(__dirname, '../uploads/homepage');

const filesToCopy = [
    { src: 'banner_global_trade_1779356255214.png', dest: 'banner_global_trade.png' },
    { src: 'banner_smart_factory_1779356278961.png', dest: 'banner_smart_factory.png' },
    { src: 'banner_ai_sourcing_1779356480821.png', dest: 'banner_ai_sourcing.png' },
    { src: 'mobile_app_promo_1779356461931.png', dest: 'mobile_app_promo.png' }
];

const run = async () => {
    try {
        console.log('1. Copying premium generated assets to uploads/homepage/');
        if (!fs.existsSync(uploadsHomepageDir)) {
            fs.mkdirSync(uploadsHomepageDir, { recursive: true });
            console.log(`Created directory: ${uploadsHomepageDir}`);
        }

        for (const file of filesToCopy) {
            const srcPath = path.join(artifactsDir, file.src);
            const destPath = path.join(uploadsHomepageDir, file.dest);
            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
                console.log(`Successfully copied ${file.src} to ${destPath}`);
            } else {
                console.error(`Source file not found: ${srcPath}`);
            }
        }

        console.log('\n2. Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        console.log('MongoDB connection established.');

        // Update Banners
        console.log('\n3. Updating Hero Banners in DB...');
        const slideGlobal = await HeroSlide.findOneAndUpdate(
            { order: 0 },
            { image: '/uploads/homepage/banner_global_trade.png' },
            { new: true }
        );
        console.log('Updated order 0 banner:', slideGlobal ? slideGlobal.image : 'NOT FOUND');

        const slideFactory = await HeroSlide.findOneAndUpdate(
            { order: 1 },
            { image: '/uploads/homepage/banner_smart_factory.png' },
            { new: true }
        );
        console.log('Updated order 1 banner:', slideFactory ? slideFactory.image : 'NOT FOUND');

        const slideAi = await HeroSlide.findOneAndUpdate(
            { order: 2 },
            { image: '/uploads/homepage/banner_ai_sourcing.png' },
            { new: true }
        );
        console.log('Updated order 2 banner:', slideAi ? slideAi.image : 'NOT FOUND');

        // Update App Promo Image
        console.log('\n4. Updating App Promo section image in DB...');
        const appSection = await HomepageSection.findOneAndUpdate(
            { id_name: 'app_promo' },
            { data: { image: '/uploads/homepage/mobile_app_promo.png' } },
            { new: true }
        );
        console.log('Updated app_promo section image:', appSection && appSection.data ? appSection.data.image : 'NOT FOUND');

        // Sync categories
        console.log('\n5. Syncing Categories & Subcategories from categories.json...');
        const jsonPath = path.join(__dirname, '../storage/dummy_data_import/categories.json');
        if (fs.existsSync(jsonPath)) {
            const categoriesData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            console.log(`Loaded ${categoriesData.length} categories from seed file.`);

            // Drop existing categories and insert the seeded ones
            await Category.deleteMany({});
            const result = await Category.insertMany(categoriesData);
            console.log(`Successfully imported ${result.length} categories into database.`);
        } else {
            console.error(`categories.json not found at ${jsonPath}`);
        }

        console.log('\n✅ All database and asset updates completed successfully!');
        await mongoose.connection.close();
    } catch (err) {
        console.error('An error occurred during update execution:', err);
    }
};

run();
