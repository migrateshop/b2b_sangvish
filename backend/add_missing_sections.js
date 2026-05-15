const mongoose = require('mongoose');
const dotenv = require('dotenv');
const HomepageSection = require('./models/HomepageSection');

dotenv.config();

const addMissingSections = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const existing = await HomepageSection.findOne({ id_name: 'featured_selections' });
        if (!existing) {
            await HomepageSection.create({
                id_name: 'featured_selections',
                title: 'Top Deals & Ranking',
                subtitle: 'Discover the best deals and top-ranked products',
                is_active: true,
                order: 2
            });
            console.log('Added featured_selections section');
        } else {
            console.log('featured_selections already exists');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

addMissingSections();
