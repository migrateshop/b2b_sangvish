const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createCheckoutSession, getMyOrders, getOrderById, verifySession, getAllOrdersAdmin, getSupplierOrders, updateOrderStatus, checkoutQuote, confirmDelivery, deleteOrderAdmin, clearPendingOrdersAdmin, verifyRazorpayPayment, verifyPayPalPayment } = require('../controllers/orderController');

router.post('/checkout-quote/:quoteId', protect, checkoutQuote);
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/verify-session', protect, verifySession);
router.post('/verify-razorpay', protect, verifyRazorpayPayment);
router.post('/verify-paypal', protect, verifyPayPalPayment);
router.get('/my-orders', protect, getMyOrders);
router.get('/supplier-orders', protect, getSupplierOrders);
router.get('/admin/all', protect, getAllOrdersAdmin);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);
router.put('/:id/confirm-delivery', protect, confirmDelivery);
router.delete('/admin/clear-pending', protect, clearPendingOrdersAdmin);
router.delete('/admin/:id', protect, deleteOrderAdmin);

module.exports = router;
