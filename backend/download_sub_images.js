const fs = require('fs');
const path = require('path');
const https = require('https');

const uploadDir = path.join(__dirname, 'uploads', 'categories', 'subs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 20 representative images for subcategories (one for each parent theme)
const subImages = [
    { name: 'machinery_part.jpg', url: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&w=300&q=60' },
    { name: 'farm_crop.jpg', url: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=300&q=60' },
    { name: 'gadget.jpg', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=300&q=60' },
    { name: 'fabric.jpg', url: 'https://images.unsplash.com/photo-1528459840111-0d30de0439bc?auto=format&fit=crop&w=300&q=60' },
    { name: 'furniture_detail.jpg', url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=60' },
    { name: 'medical_tool.jpg', url: 'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&w=300&q=60' },
    { name: 'cosmetics.jpg', url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=300&q=60' },
    { name: 'sports_gear.jpg', url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=300&q=60' },
    { name: 'toy_block.jpg', url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=300&q=60' },
    { name: 'car_wheel.jpg', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=60' },
    { name: 'hand_tool.jpg', url: 'https://images.unsplash.com/photo-1510521212584-59cb70ec1d7e?auto=format&fit=crop&w=300&q=60' },
    { name: 'cardboard.jpg', url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=300&q=60' },
    { name: 'beaker.jpg', url: 'https://images.unsplash.com/photo-1582719501235-efd300556526?auto=format&fit=crop&w=300&q=60' },
    { name: 'steel_beam.jpg', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=60' },
    { name: 'door_handle.jpg', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=60' },
    { name: 'fruit_basket.jpg', url: 'https://images.unsplash.com/photo-1610832958506-aa5633842699?auto=format&fit=crop&w=300&q=60' },
    { name: 'notebook.jpg', url: 'https://images.unsplash.com/photo-1531346878377-a5be208386a3?auto=format&fit=crop&w=300&q=60' },
    { name: 'ornament.jpg', url: 'https://images.unsplash.com/photo-1512909002072-4ca241476dbd?auto=format&fit=crop&w=300&q=60' },
    { name: 'lamp.jpg', url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=300&q=60' },
    { name: 'circuit.jpg', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=60' }
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

async function downloadSubs() {
    console.log('Downloading subcategory images...');
    for (const img of subImages) {
        const dest = path.join(uploadDir, img.name);
        try {
            await download(img.url, dest);
            console.log(`Downloaded: ${img.name}`);
        } catch (error) {
            console.error(`Error downloading ${img.name}:`, error.message);
        }
    }
    console.log('Finished downloading subcategory images.');
}

downloadSubs();
