const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const {
    openDispute,
    getMyDisputes,
    addDisputeMessage,
    getAllDisputesAdmin,
    resolveDispute
} = require('../controllers/disputeController');

// Buyer / Supplier
router.post('/', protect, openDispute);                          // Open a dispute
router.get('/my-disputes', protect, getMyDisputes);              // Get my disputes
router.post('/:id/message', protect, addDisputeMessage);         // Add message to thread

// Admin
router.get('/admin/all', protect, authorizeRoles('admin'), getAllDisputesAdmin);
router.put('/:id/resolve', protect, authorizeRoles('admin'), resolveDispute);

module.exports = router;
