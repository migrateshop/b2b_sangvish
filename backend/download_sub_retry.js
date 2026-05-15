const fs = require('fs');
const path = require('path');
const https = require('https');

const uploadDir = path.join(__dirname, 'uploads', 'categories', 'subs');
const subImagesRetry = [
    { name: 'fabric.jpg', url: 'https://images.unsplash.com/photo-1544441893-675973e31d85?auto=format&fit=crop&w=300&q=60' },
    { name: 'hand_tool.jpg', url: 'https://images.unsplash.com/photo-1586864387917-3135fe999e4b?auto=format&fit=crop&w=300&q=60' },
    { name: 'beaker.jpg', url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=300&q=60' },
    { name: 'fruit_basket.jpg', url: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=300&q=60' },
    { name: 'notebook.jpg', url: 'https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?auto=format&fit=crop&w=300&q=60' },
    { name: 'ornament.jpg', url: 'https://images.unsplash.com/photo-1513519213501-c88f119047d7?auto=format&fit=crop&w=300&q=60' }
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

async function downloadRetry() {
    for (const img of subImagesRetry) {
        const dest = path.join(uploadDir, img.name);
        try {
            await download(img.url, dest);
            console.log(`Downloaded: ${img.name}`);
        } catch (error) {
            console.error(`Error downloading ${img.name}:`, error.message);
        }
    }
}

downloadRetry();
