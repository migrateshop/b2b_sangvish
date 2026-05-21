const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
require('../models/SiteSetting');
const SiteSetting = mongoose.model('SiteSetting');

const showSettings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        const settings = await SiteSetting.findOne({});
        console.log(JSON.stringify(settings, null, 2));
        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
};
showSettings();
