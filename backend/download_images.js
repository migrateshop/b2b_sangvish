const fs = require('fs');
const path = require('path');
const https = require('https');

const uploadDir = path.join(__dirname, 'uploads', 'categories');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const images = [
    { name: 'industrial_machinery.jpg', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=60' },
    { name: 'agriculture.jpg', url: 'https://images.unsplash.com/photo-1523348830342-d316109c132c?auto=format&fit=crop&w=500&q=60' },
    { name: 'consumer_electronics.jpg', url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=500&q=60' },
    { name: 'apparel_fashion.jpg', url: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=500&q=60' },
    { name: 'home_garden_furniture.jpg', url: 'https://images.unsplash.com/photo-1416870213587-7980fe4403d8?auto=format&fit=crop&w=500&q=60' },
    { name: 'health_medical.jpg', url: 'https://images.unsplash.com/photo-1505751172107-16016c0ad492?auto=format&fit=crop&w=500&q=60' },
    { name: 'beauty_personal_care.jpg', url: 'https://images.unsplash.com/photo-1522335789203-aa9fb9a60ee8?auto=format&fit=crop&w=500&q=60' },
    { name: 'sports_entertainment.jpg', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=500&q=60' },
    { name: 'toys_hobbies.jpg', url: 'https://images.unsplash.com/photo-1532330393533-44116430153f?auto=format&fit=crop&w=500&q=60' },
    { name: 'vehicles_accessories.jpg', url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=500&q=60' },
    { name: 'tools_hardware.jpg', url: 'https://images.unsplash.com/photo-1530124560676-4fbc91abc6f2?auto=format&fit=crop&w=500&q=60' },
    { name: 'packaging_printing.jpg', url: 'https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&w=500&q=60' },
    { name: 'chemicals.jpg', url: 'https://images.unsplash.com/photo-1532187875605-18408013f9b9?auto=format&fit=crop&w=500&q=60' },
    { name: 'metallurgy_mining.jpg', url: 'https://images.unsplash.com/photo-1518115392070-55b68df7f0c1?auto=format&fit=crop&w=500&q=60' },
    { name: 'construction_real_estate.jpg', url: 'https://images.unsplash.com/photo-1541913057-074934f0c69d?auto=format&fit=crop&w=500&q=60' },
    { name: 'food_beverage.jpg', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=60' },
    { name: 'office_school_supplies.jpg', url: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=500&q=60' },
    { name: 'gifts_crafts.jpg', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=500&q=60' },
    { name: 'lights_lighting.jpg', url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=500&q=60' },
    { name: 'electrical_equipment.jpg', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=500&q=60' }
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

async function downloadAll() {
    console.log('Downloading images to local storage...');
    for (const img of images) {
        const dest = path.join(uploadDir, img.name);
        try {
            await download(img.url, dest);
            console.log(`Downloaded: ${img.name}`);
        } catch (error) {
            console.error(`Error downloading ${img.name}:`, error.message);
        }
    }
    console.log('Finished downloading images.');
}

downloadAll();
