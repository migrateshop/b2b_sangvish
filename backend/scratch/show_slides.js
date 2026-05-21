const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
require('../models/HeroSlide');
const HeroSlide = mongoose.model('HeroSlide');

const showSlides = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_clone');
        const slides = await HeroSlide.find({});
        console.log(`Found ${slides.length} slides in DB:`);
        slides.forEach(s => {
            console.log(JSON.stringify(s, null, 2));
        });
        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
};
showSlides();
