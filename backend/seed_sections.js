const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding sections...');

        const supplier = await User.findOne({ role: 'supplier' });
        if (!supplier) {
            console.error('No supplier found. Please run seeders first.');
            process.exit(1);
        }

        const categories = await Category.find({ status: 'active' });
        if (categories.length === 0) {
            console.error('No categories found. Please run seeders first.');
            process.exit(1);
        }

        const products = [
            {
                name: 'High Performance Gaming Laptop RTX 4090',
                description: 'Latest generation gaming laptop with top-tier specs for professional gaming and content creation.',
                supplier: supplier._id,
                category: categories[0]._id,
                moq: 5,
                main_price: 1299.99,
                oldPrice: 1599.99,
                rating: 4.9,
                numReviews: 120,
                numOrders: 500,
                status: 'active',
                approval_status: 'approved',
                section: 'Top Ranking',
                images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=2068&auto=format&fit=crop'],
                main_image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=2068&auto=format&fit=crop'
            },
            {
                name: 'Wireless Noise Cancelling Headphones v2',
                description: 'Premium wireless headphones with active noise cancellation and 40-hour battery life.',
                supplier: supplier._id,
                category: categories[0]._id,
                moq: 10,
                main_price: 149.50,
                oldPrice: 199.99,
                rating: 4.8,
                numReviews: 250,
                numOrders: 1200,
                status: 'active',
                approval_status: 'approved',
                section: 'Top Deals',
                images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'],
                main_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'
            },
            {
                name: 'Smart Watch Series 9 Gold Edition',
                description: 'Elegant smart watch with health tracking features and AMOLED display.',
                supplier: supplier._id,
                category: categories[0]._id,
                moq: 20,
                main_price: 89.00,
                oldPrice: 120.00,
                rating: 4.7,
                numReviews: 85,
                numOrders: 300,
                status: 'active',
                approval_status: 'approved',
                section: 'Top Ranking',
                images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'],
                main_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'
            },
            {
                name: 'Ergonomic Office Chair with Lumbar Support',
                description: 'Comfortable office chair designed for long hours of work with breathable mesh.',
                supplier: supplier._id,
                category: categories[1] ? categories[1]._id : categories[0]._id,
                moq: 2,
                main_price: 199.00,
                oldPrice: 299.00,
                rating: 4.6,
                numReviews: 45,
                numOrders: 150,
                status: 'active',
                approval_status: 'approved',
                section: 'New Arrivals',
                images: ['https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=2071&auto=format&fit=crop'],
                main_image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=2071&auto=format&fit=crop'
            },
            {
                name: 'Portable Bluetooth Speaker IPX7 Waterproof',
                description: 'Rugged outdoor speaker with deep bass and waterproof design.',
                supplier: supplier._id,
                category: categories[0]._id,
                moq: 50,
                main_price: 35.00,
                oldPrice: 59.99,
                rating: 4.5,
                numReviews: 110,
                numOrders: 800,
                status: 'active',
                approval_status: 'approved',
                section: 'Top Deals',
                images: ['https://images.unsplash.com/photo-1608351489242-99f57d3835f8?q=80&w=1974&auto=format&fit=crop'],
                main_image: 'https://images.unsplash.com/photo-1608351489242-99f57d3835f8?q=80&w=1974&auto=format&fit=crop'
            }
        ];

        await Product.insertMany(products);
        console.log('Seeded 5 products into sections.');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
