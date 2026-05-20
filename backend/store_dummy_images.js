const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const baseUploadsDir = path.join(__dirname, 'uploads');
const dummyDataDir = path.join(__dirname, 'storage', 'dummy_data_import');

const downloadImage = (url, destPath) => {
    return new Promise((resolve, reject) => {
        if (!url.startsWith('http')) return resolve(url); // Already local or invalid
        
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirect
                https.get(response.headers.location, (res) => {
                    res.pipe(file);
                    file.on('finish', () => { file.close(); resolve(); });
                }).on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
            } else if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            } else {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            }
        }).on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
        });
    });
};

const getExtension = (url) => {
    // Unsplash urls often don't have extensions, default to .jpg
    return '.jpg';
};

const processCategories = async () => {
    console.log('Processing categories...');
    const catFile = path.join(dummyDataDir, 'categories.json');
    if (!fs.existsSync(catFile)) return;
    
    let categories = JSON.parse(fs.readFileSync(catFile, 'utf-8'));
    const catDir = path.join(baseUploadsDir, 'categories');
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

    for (let i = 0; i < categories.length; i++) {
        let cat = categories[i];
        if (cat.image && cat.image.startsWith('http')) {
            const ext = getExtension(cat.image);
            const filename = `cat_${cat._id}${ext}`;
            const destPath = path.join(catDir, filename);
            
            console.log(`Downloading category image ${i+1}/${categories.length}: ${cat.title}`);
            try {
                await downloadImage(cat.image, destPath);
                cat.image = `/uploads/categories/${filename}`;
            } catch (err) {
                console.error(`Failed to download ${cat.image}:`, err.message);
            }
        }
    }
    
    fs.writeFileSync(catFile, JSON.stringify(categories, null, 4));
    console.log('Categories updated.');
};

const processProducts = async () => {
    console.log('Processing products...');
    const prodFile = path.join(dummyDataDir, 'products.json');
    if (!fs.existsSync(prodFile)) return;
    
    let products = JSON.parse(fs.readFileSync(prodFile, 'utf-8'));
    const prodDir = path.join(baseUploadsDir, 'products');
    if (!fs.existsSync(prodDir)) fs.mkdirSync(prodDir, { recursive: true });

    for (let i = 0; i < products.length; i++) {
        let prod = products[i];
        
        // main_image
        if (prod.main_image && prod.main_image.startsWith('http')) {
            const ext = getExtension(prod.main_image);
            const filename = `prod_${prod._id}_main${ext}`;
            const destPath = path.join(prodDir, filename);
            
            console.log(`Downloading product main image ${i+1}/${products.length}: ${prod.name}`);
            try {
                await downloadImage(prod.main_image, destPath);
                prod.main_image = `/uploads/products/${filename}`;
            } catch (err) {
                console.error(`Failed to download ${prod.main_image}:`, err.message);
            }
        }
        
        // images array
        if (prod.images && Array.isArray(prod.images)) {
            for (let j = 0; j < prod.images.length; j++) {
                let imgUrl = prod.images[j];
                if (imgUrl.startsWith('http')) {
                    const ext = getExtension(imgUrl);
                    const filename = `prod_${prod._id}_sub_${j}${ext}`;
                    const destPath = path.join(prodDir, filename);
                    
                    try {
                        await downloadImage(imgUrl, destPath);
                        prod.images[j] = `/uploads/products/${filename}`;
                    } catch (err) {
                        console.error(`Failed to download ${imgUrl}:`, err.message);
                    }
                }
            }
        }
    }
    
    fs.writeFileSync(prodFile, JSON.stringify(products, null, 4));
    console.log('Products updated.');
};

const main = async () => {
    if (!fs.existsSync(baseUploadsDir)) fs.mkdirSync(baseUploadsDir, { recursive: true });
    
    await processCategories();
    await processProducts();
    
    console.log('All dummy data images have been stored locally and JSON files updated.');
};

main();
