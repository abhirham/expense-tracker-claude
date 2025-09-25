import { Router } from 'express';
import { TransactionCategorizationService } from '../services/TransactionCategorizationService.js';
import { Transaction } from '../types/index.js';

const router = Router();
const categorizationService = new TransactionCategorizationService();

// Categorize a single transaction using Claude
router.post('/categorize', async (req, res) => {
  try {
    const { description, amount, merchant } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Transaction description is required'
        },
        timestamp: new Date()
      });
    }

    const category = await categorizationService.categorizeTransaction({
      description,
      amount: amount || 0,
      merchant: merchant || undefined
    });

    res.json({
      success: true,
      data: { category },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Transaction categorization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORIZATION_ERROR',
        message: 'Failed to categorize transaction'
      },
      timestamp: new Date()
    });
  }
});

// Categorize multiple transactions in batch
router.post('/categorize-batch', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Array of transactions is required'
        },
        timestamp: new Date()
      });
    }

    const categorizedTransactions = await categorizationService.categorizeTransactionBatch(transactions);

    res.json({
      success: true,
      data: categorizedTransactions,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Batch categorization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_CATEGORIZATION_ERROR',
        message: 'Failed to categorize transaction batch'
      },
      timestamp: new Date()
    });
  }
});

// Get available transaction categories
router.get('/categories', (req, res) => {
  const categories = [
    'Restaurants',
    'Groceries',
    'Car',
    'Entertainment',
    'Coffee Shop',
    'Shopping',
    'Home',
    'Cne',
    'Transport',
    'Health',
    'Pets',
    'Misc',
    'Family',
    'Personal Care',
    'Financial',
    'Utilities'
  ];

  res.json({
    success: true,
    data: categories,
    timestamp: new Date()
  });
});

export default router;