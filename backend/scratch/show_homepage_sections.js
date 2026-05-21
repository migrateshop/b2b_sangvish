const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
require('../models/HomepageSection');
const HomepageSection = mongoose.model('HomepageSection');

const show = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        const sections = await HomepageSection.find({});
        console.log(JSON.stringify(sections, null, 2));
        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
};
show();
