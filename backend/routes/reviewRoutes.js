const express = require('express');
const router = express.Router();
const { createReview, getProductReviews, getMyReviews } = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.get('/product/:productId', getProductReviews);

module.exports = router;
