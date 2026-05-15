const express = require('express');
const router = express.Router();
const { aiSourcingSearch, refineAiText, getAiHistory, deleteHistory, getAiUsage } = require('../controllers/aiController');
const { protect, softProtect } = require('../middlewares/authMiddleware');

router.post('/search', softProtect, aiSourcingSearch);
router.post('/refine', protect, refineAiText);
router.get('/history', protect, getAiHistory);
router.get('/usage', protect, getAiUsage);
router.delete('/history/:id', protect, deleteHistory);

module.exports = router;
