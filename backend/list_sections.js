const mongoose = require('mongoose');
const dotenv = require('dotenv');
const HomepageSection = require('./models/HomepageSection');

dotenv.config();

const listSections = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const sections = await HomepageSection.find({}).sort({ order: 1 });
        console.log(JSON.stringify(sections, null, 2));
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listSections();
