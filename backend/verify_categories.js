const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

// Register Category schema
require('./models/Category');
const Category = mongoose.model('Category');

const verifyCategories = async () => {
    try {
        console.log("Connecting to MongoDB at:", process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        
        const categories = await Category.find({});
        console.log(`\n--- Verification Start: checking ${categories.length} categories ---\n`);
        
        let allValid = true;
        
        for (const cat of categories) {
            console.log(`Checking Category: "${cat.title}" (ID: ${cat._id})`);
            console.log(`  Slug: ${cat.slug}`);
            console.log(`  Status: ${cat.status}`);
            console.log(`  Level: ${cat.level}`);
            console.log(`  Image Path in DB: "${cat.image}"`);
            
            if (cat.image) {
                // Remove leading slash if any
                const cleanPath = cat.image.replace(/^\//, '');
                const absPath = path.join(__dirname, cleanPath);
                
                if (fs.existsSync(absPath)) {
                    const stats = fs.statSync(absPath);
                    console.log(`  ✅ Image file exists: ${absPath} (${stats.size} bytes)`);
                    if (stats.size === 0) {
                        console.log(`  ❌ ERROR: Category image file is 0 bytes!`);
                        allValid = false;
                    }
                } else {
                    console.log(`  ❌ ERROR: Category image file does not exist at ${absPath}`);
                    allValid = false;
                }
            } else {
                console.log(`  ⚠️ WARNING: Category has no image defined`);
                allValid = false;
            }
            console.log('');
        }
        
        if (allValid) {
            console.log('⭐ ALL CATEGORY IMAGES ARE VALID AND EXIST IN STORAGE! ⭐\n');
        } else {
            console.log('❌ SOME CATEGORY IMAGES HAVE ISSUES OR ARE MISSING! ❌\n');
        }
        
        await mongoose.connection.close();
        process.exit(allValid ? 0 : 1);
    } catch (err) {
        console.error("Error running verification:", err);
        process.exit(1);
    }
};

verifyCategories();
