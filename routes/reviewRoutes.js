// routes/reviewRoutes.js
const express = require('express');
const router  = express.Router();
const reviewCtrl = require('../controllers/reviewController');

// POST /api/customers/submitReview
router.post(
  '/customers/submitReview',
  reviewCtrl.submitReview
);

module.exports = router;
