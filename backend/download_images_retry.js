const fs = require('fs');
const path = require('path');
const https = require('https');

const uploadDir = path.join(__dirname, 'uploads', 'categories');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const images = [
    { name: 'agriculture.jpg', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=500&q=60' },
    { name: 'home_garden_furniture.jpg', url: 'https://images.unsplash.com/photo-1513584684374-8bdb74838a0f?auto=format&fit=crop&w=500&q=60' },
    { name: 'health_medical.jpg', url: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=500&q=60' },
    { name: 'beauty_personal_care.jpg', url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=500&q=60' },
    { name: 'toys_hobbies.jpg', url: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=500&q=60' },
    { name: 'tools_hardware.jpg', url: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&w=500&q=60' },
    { name: 'packaging_printing.jpg', url: 'https://images.unsplash.com/photo-1566937169390-7be4c63b8a0e?auto=format&fit=crop&w=500&q=60' },
    { name: 'chemicals.jpg', url: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?auto=format&fit=crop&w=500&q=60' },
    { name: 'metallurgy_mining.jpg', url: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=500&q=60' },
    { name: 'construction_real_estate.jpg', url: 'https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&w=500&q=60' }
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

async function downloadRemaining() {
    console.log('Downloading missing images to local storage...');
    for (const img of images) {
        const dest = path.join(uploadDir, img.name);
        try {
            await download(img.url, dest);
            console.log(`Downloaded: ${img.name}`);
        } catch (error) {
            console.error(`Error downloading ${img.name}:`, error.message);
        }
    }
    console.log('Finished downloading remaining images.');
}

downloadRemaining();
