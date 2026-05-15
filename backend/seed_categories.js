const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config();

const categories = [
    {
        title: 'Machinery & Equipment',
        description: 'Industrial machinery, construction equipment, and more.',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        subcategories: [
            'Agriculture Machinery',
            'Construction Machinery',
            'Food & Beverage Machinery',
            'Manufacturing & Processing Machinery',
            'Metal & Metallurgy Machinery'
        ]
    },
    {
        title: 'Electronics & Accessories',
        description: 'Consumer electronics, parts, and accessories.',
        image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        subcategories: [
            'Consumer Electronics',
            'Home Appliances',
            'Security & Protection',
            'Electronic Components',
            'Office Electronics'
        ]
    },
    {
        title: 'Home & Garden',
        description: 'Everything for your home and outdoor spaces.',
        image: 'https://images.unsplash.com/photo-1416870213587-7980fe4403d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        subcategories: [
            'Furniture',
            'Kitchen & Tabletop',
            'Home Decor',
            'Garden Supplies',
            'Household Chemicals'
        ]
    },
    {
        title: 'Apparel & Textiles',
        description: 'Fashionable clothing and high-quality textiles.',
        image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        subcategories: [
            'Men\'s Clothing',
            'Women\'s Clothing',
            'Sports & Entertainment',
            'Textile & Fabric',
            'Shoes & Accessories'
        ]
    },
    {
        title: 'Vehicles & Accessories',
        description: 'Cars, trucks, and all types of vehicle parts.',
        image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        subcategories: [
            'Automobiles',
            'Auto Replacement Parts',
            'Motorcycles',
            'Trucks',
            'Bus & Coach'
        ]
    }
];

async function seedCategories() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('Cleared existing categories');

        for (const catData of categories) {
            const parent = await Category.create({
                title: catData.title,
                description: catData.description,
                image: catData.image,
                level: 0
            });
            console.log(`Created parent category: ${parent.title}`);

            for (const subTitle of catData.subcategories) {
                await Category.create({
                    title: subTitle,
                    parent: parent._id,
                    level: 1
                });
                console.log(`  Created subcategory: ${subTitle}`);
            }
        }

        console.log('Category seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
}

seedCategories();
