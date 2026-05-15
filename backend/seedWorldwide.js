const mongoose = require('mongoose');
const IndustryHub = require('./models/IndustryHub');
const TopRanking = require('./models/TopRanking');
require('dotenv').config();

const hubs = [
    {
        title: 'Luxury jewelry & Accessories',
        desc: 'Expertly crafted, European-style, high-quality tailored jewelry',
        country: 'Hong Kong, China',
        flag: 'hk',
        image: '/jewelry_hub_main_1773128071506.png', // This is in public folder
        sideImages: [
            '/hong_kong_jewelry_main_1773128103047.png',
            '/media__1773127986703.png'
        ],
        isActive: true
    },
    {
        title: 'Islamic clothing and accessories',
        desc: 'Crafted in Türkiye: Abayas, hijabs, dresses',
        country: 'Türkiye',
        flag: 'tr',
        image: '/islamic_clothing_main_1773128204241.png',
        sideImages: [
            '/media__1773128001225.png',
            '/media__1773128011764.png'
        ],
        isActive: true
    },
    {
        title: 'Jewelry made in Türkiye',
        desc: 'Turkish handcrafts: Ottoman and Islamic styles',
        country: 'Türkiye',
        flag: 'tr',
        image: '/turkiye_jewelry_main_1773128222665.png',
        sideImages: [
            '/media__1773128513515.png',
            '/media__1773128549914.png'
        ],
        isActive: true
    }
];

const ranks = [
    {
        category: 'Organic Cashew Nuts',
        country: 'Vietnam',
        flag: 'vn',
        items: [
            { name: 'Cashew Grade A', score: '98.9', img: '/cashew_nuts_main_1773128236238.png' },
            { name: 'Roasted Cashew', score: '94.3', img: '/media__1773124974185.png' },
            { name: 'Raw Cashew', score: '92.1', img: '/media__1773125087924.png' }
        ],
        isActive: true
    },
    {
        category: 'Rice',
        country: 'Vietnam',
        flag: 'vn',
        items: [
            { name: 'Jasmine Rice', score: '99.1', img: '/rice_main_1773128254733.png' },
            { name: 'Brown Rice', score: '96.5', img: '/media__1773124325895.png' },
            { name: 'White Rice', score: '94.0', img: '/media__1773124673164.png' }
        ],
        isActive: true
    },
    {
        category: 'Indian & Pakistani Clothing',
        country: 'India',
        flag: 'in',
        items: [
            { name: 'Kurta Set', score: '95.2', img: '/media__1773123478961.png' },
            { name: 'Saree', score: '91.8', img: '/media__1773123603429.png' },
            { name: 'Salwar Kameez', score: '88.0', img: '/media__1773123798235.png' }
        ],
        isActive: true
    },
    {
        category: 'Shell, Bone & Coral Beads',
        country: 'India',
        flag: 'in',
        items: [
            { name: 'Traditional Bead', score: '88.5', img: '/media__1773127035122.png' },
            { name: 'Luxury Bead', score: '82.1', img: '/media__1773127151505.png' },
            { name: 'Shell Ornament', score: '79.4', img: '/media__1773127516828.png' }
        ],
        isActive: true
    }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_demo').then(async () => {
    console.log('Connected to DB');
    await IndustryHub.deleteMany({});
    await TopRanking.deleteMany({});
    console.log('Cleared existing worldwide data');

    await IndustryHub.insertMany(hubs);
    await TopRanking.insertMany(ranks);
    console.log('Successfully seeded Worldwide DB Sections with real image paths');
    mongoose.disconnect();
}).catch(err => {
    console.error(err);
    mongoose.disconnect();
});
