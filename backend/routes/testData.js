const express = require('express');
const router = express.Router();
const { addTestTransactions } = require('../utils/testData');
const { protect } = require('../middleware/auth');

// @route   POST /api/v1/test/transactions
// @desc    Add test transactions for the current user
// @access  Private
router.post('/transactions', protect, async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const transactions = await addTestTransactions(req.user.id, count);
    
    res.status(201).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Error adding test transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
