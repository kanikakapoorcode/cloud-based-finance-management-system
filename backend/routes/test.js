const express = require('express');
const router = express.Router();
const db = require('../services/db');
const fs = require('fs').promises;
const path = require('path');

// Test endpoint to check database status
router.get('/status', async (req, res) => {
  try {
    // Check if database file exists
    const dbPath = path.join(__dirname, '../data/db.json');
    const dbExists = await fs.access(dbPath).then(() => true).catch(() => false);
    
    // Get some stats
    const users = await db.getUsers();
    const transactions = await db.getTransactions();
    
    res.status(200).json({
      success: true,
      dbExists,
      stats: {
        users: users.length,
        transactions: transactions.length
      },
      sampleTransaction: transactions[0] || null
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
