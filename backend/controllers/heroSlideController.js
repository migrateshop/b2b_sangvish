const HeroSlide = require('../models/HeroSlide');

// Public - Get active slides
exports.getActiveSlides = async (req, res) => {
    try {
        const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 });
        res.status(200).json(slides);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch slides', error: err.message });
    }
};

// Admin - Get all slides
exports.getAllSlides = async (req, res) => {
    try {
        const slides = await HeroSlide.find().sort({ order: 1, createdAt: -1 });
        res.status(200).json(slides);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch slides', error: err.message });
    }
};

// Admin - Create slide
exports.createSlide = async (req, res) => {
    try {
        const slide = new HeroSlide(req.body);
        await slide.save();
        res.status(201).json(slide);
    } catch (err) {
        res.status(400).json({ message: 'Failed to create slide', error: err.message });
    }
};

// Admin - Update slide
exports.updateSlide = async (req, res) => {
    try {
        const slide = await HeroSlide.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!slide) return res.status(404).json({ message: 'Slide not found' });
        res.status(200).json(slide);
    } catch (err) {
        res.status(400).json({ message: 'Failed to update slide', error: err.message });
    }
};

// Admin - Delete slide
exports.deleteSlide = async (req, res) => {
    try {
        const slide = await HeroSlide.findByIdAndDelete(req.params.id);
        if (!slide) return res.status(404).json({ message: 'Slide not found' });
        res.status(200).json({ message: 'Slide deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Failed to delete slide', error: err.message });
    }
};
