import { Router } from 'express';
import { BankingService } from '../services/BankingService.js';
import { BankConnectionRequest, TransactionFetchRequest } from '../types/index.js';

const router = Router();
const bankingService = new BankingService();

// Get list of supported banks
router.get('/banks', async (req, res) => {
  try {
    const supportedBanks = bankingService.getSupportedBanks();
    res.json({
      success: true,
      data: supportedBanks,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting supported banks:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BANKS_LIST_ERROR',
        message: 'Failed to get supported banks'
      },
      timestamp: new Date()
    });
  }
});

// Connect to bank and get accounts
router.post('/connect', async (req, res) => {
  try {
    const { bankName, credentials }: BankConnectionRequest = req.body;

    if (!bankName || !credentials) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Bank name and credentials are required'
        },
        timestamp: new Date()
      });
    }

    const result = await bankingService.connectToBank(bankName, credentials);

    if (result.success) {
      res.json({
        success: true,
        data: result.accounts,
        timestamp: new Date()
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: result.error || 'Failed to connect to bank'
        },
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Bank connection error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BANK_CONNECTION_ERROR',
        message: 'Internal server error during bank connection'
      },
      timestamp: new Date()
    });
  }
});

// Fetch transactions for an account
router.post('/transactions', async (req, res) => {
  try {
    const { accountId, dateRange }: TransactionFetchRequest = req.body;

    if (!accountId || !dateRange) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Account ID and date range are required'
        },
        timestamp: new Date()
      });
    }

    const result = await bankingService.fetchTransactions(accountId, dateRange);

    if (result.success) {
      res.json({
        success: true,
        data: result.transactions,
        timestamp: new Date()
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'TRANSACTION_FETCH_FAILED',
          message: result.error || 'Failed to fetch transactions'
        },
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Transaction fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSACTION_FETCH_ERROR',
        message: 'Internal server error during transaction fetch'
      },
      timestamp: new Date()
    });
  }
});

export default router;