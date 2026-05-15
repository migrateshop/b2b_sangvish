const express = require('express');
const router = express.Router();
const { getCompanyProfile, upsertCompanyProfile, getCompanyById, searchCompanies, getCompanyLocations } = require('../controllers/companyController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadCompanyFiles } = require('../middlewares/uploadMiddleware');

// Route for searching companies
router.get('/search', searchCompanies);
router.get('/locations', getCompanyLocations);
router.get('/supplier/:id', getCompanyById);

// Route for getting and updating the company profile
router.route('/profile')
    .get(protect, getCompanyProfile)
    .post(protect, uploadCompanyFiles, upsertCompanyProfile)
    .put(protect, uploadCompanyFiles, upsertCompanyProfile);

module.exports = router;
