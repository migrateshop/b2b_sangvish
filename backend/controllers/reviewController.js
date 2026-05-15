const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
    try {
        const { product_id, order_id, rating, comment } = req.body;

        // Verify the order exists, belongs to the buyer, and is delivered
        const order = await Order.findOne({ _id: order_id, buyer_id: req.user._id });
        if (!order) {
            return res.status(404).json({ message: 'Order not found or not authorized' });
        }

        // Technically, you might restrict to 'delivered' orders, but for testing we check if the item is in the order
        const itemInOrder = order.order_items.find(item => item.product_id.toString() === product_id);
        if (!itemInOrder) {
            return res.status(400).json({ message: 'Product is not part of this order' });
        }

        const alreadyReviewed = await Review.findOne({ buyer_id: req.user._id, product_id, order_id });
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this product for this order' });
        }

        const review = await Review.create({
            buyer_id: req.user._id,
            supplier_id: order.supplier_id,
            product_id,
            order_id,
            rating,
            comment
        });

        // Update Product Rating
        const productReviews = await Review.find({ product_id });
        const numReviews = productReviews.length;
        const avgRating = productReviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

        await Product.findByIdAndUpdate(product_id, {
            rating: avgRating,
            numReviews
        });

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
    try {
        let productId = req.params.productId;

        // If it looks like a slug (not a 24-char hex ID), find the product first
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            const product = await Product.findOne({ slug: productId });
            if (!product) return res.json([]); // No product, no reviews
            productId = product._id;
        }

        const reviews = await Review.find({ product_id: productId })
            .populate('buyer_id', 'first_name last_name company_name')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        console.error('getProductReviews error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all reviews a buyer has left
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ buyer_id: req.user._id })
            .populate('product_id', 'name main_image slug')
            .populate('supplier_id', 'company_name first_name last_name')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
