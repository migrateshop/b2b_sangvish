const Page = require('../models/Page');

// @desc    Get all pages
// @route   GET /api/cms/pages
exports.getPages = async (req, res) => {
    try {
        const pages = await Page.find().sort('-createdAt');
        res.json(pages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get single page by slug
// @route   GET /api/cms/pages/:slug
exports.getPageBySlug = async (req, res) => {
    try {
        const page = await Page.findOne({ slug: req.params.slug });
        if (!page) return res.status(404).json({ message: 'Page not found' });
        res.json(page);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Create/Update page (Admin only)
// @route   POST /api/cms/pages
exports.upsertPage = async (req, res) => {
    try {
        const { title, slug, content, isPublished, metaDescription } = req.body;

        let page = await Page.findOne({ slug });
        if (page) {
            page.title = title;
            page.content = content;
            page.isPublished = isPublished;
            page.metaDescription = metaDescription;
            await page.save();
        } else {
            page = await Page.create({ title, slug, content, isPublished, metaDescription });
        }

        res.status(201).json(page);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete page (Admin only)
// @route   DELETE /api/cms/pages/:id
exports.deletePage = async (req, res) => {
    try {
        await Page.findByIdAndDelete(req.params.id);
        res.json({ message: 'Page deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
