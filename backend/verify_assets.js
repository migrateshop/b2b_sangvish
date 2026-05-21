const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

// Register Product schema
require('./models/Product');
const Product = mongoose.model('Product');

const verifyAssets = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await Product.find({}, 'name main_image images');
        console.log(`\n--- Verification Start: checking ${products.length} products ---\n`);
        
        let allValid = true;
        
        for (const p of products) {
            console.log(`Checking product: ${p.name} (${p._id})`);
            
            // Check main_image
            if (p.main_image) {
                // p.main_image looks like "/uploads/products/prod_..." or relative.
                // We resolve it relative to backend directory.
                const cleanPath = p.main_image.replace(/^\//, ''); // remove leading slash if any
                const absPath = path.join(__dirname, cleanPath);
                
                if (fs.existsSync(absPath)) {
                    const stats = fs.statSync(absPath);
                    console.log(`  ✅ Main Image exists: ${p.main_image} (${stats.size} bytes)`);
                    if (stats.size === 0) {
                        console.log(`  ❌ ERROR: Main Image size is 0 bytes!`);
                        allValid = false;
                    }
                } else {
                    console.log(`  ❌ ERROR: Main Image does not exist at ${absPath}`);
                    allValid = false;
                }
            } else {
                console.log(`  ⚠️ WARNING: Product has no main_image`);
            }
            
            // Check sub images
            if (p.images && p.images.length > 0) {
                p.images.forEach((img, idx) => {
                    const cleanPath = img.replace(/^\//, '');
                    const absPath = path.join(__dirname, cleanPath);
                    
                    if (fs.existsSync(absPath)) {
                        const stats = fs.statSync(absPath);
                        console.log(`  ✅ Sub Image ${idx} exists: ${img} (${stats.size} bytes)`);
                        if (stats.size === 0) {
                            console.log(`  ❌ ERROR: Sub Image ${idx} size is 0 bytes!`);
                            allValid = false;
                        }
                    } else {
                        console.log(`  ❌ ERROR: Sub Image ${idx} does not exist at ${absPath}`);
                        allValid = false;
                    }
                });
            } else {
                console.log(`  ℹ️ Product has no sub-images`);
            }
            console.log('');
        }
        
        if (allValid) {
            console.log('⭐ ALL PRODUCT IMAGES ARE VALID AND EXIST IN STORAGE! ⭐\n');
        } else {
            console.log('❌ SOME PRODUCT IMAGES HAVE ISSUES OR ARE MISSING! ❌\n');
        }
        
        process.exit(allValid ? 0 : 1);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyAssets();
