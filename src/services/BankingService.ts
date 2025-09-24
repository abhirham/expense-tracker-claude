import { bankRegistry } from './banking/registry';
import { accountService } from './AccountService';
import { Account, DateRange, Transaction } from '../types';

export interface BankConnectionResult {
  success: boolean;
  accounts: Account[];
  error?: string;
}

export interface TransactionSyncResult {
  success: boolean;
  transactions: Transaction[];
  accountsUpdated: number;
  error?: string;
}

export class BankingService {
  private static instance: BankingService;
  private isNode = typeof window === 'undefined';

  private constructor() {}

  public static getInstance(): BankingService {
    if (!BankingService.instance) {
      BankingService.instance = new BankingService();
    }
    return BankingService.instance;
  }

  async initializeBrowser(): Promise<void> {
    if (!this.isNode) {
      console.log('Browser automation not available in client environment');
      return;
    }
    // In a real implementation, this would run on the server side
    console.log('Would initialize Playwright browser on server');
  }

  async closeBrowser(): Promise<void> {
    if (!this.isNode) {
      return;
    }
    console.log('Would close Playwright browser on server');
  }

  async connectToBank(userId: string, bankName: string): Promise<BankConnectionResult> {
    if (!this.isNode) {
      // Mock implementation for browser environment (demo purposes)
      console.log(`Mock: Connecting to ${bankName} for user ${userId}`);

      const adapter = bankRegistry.getAdapter(bankName);
      if (!adapter) {
        return {
          success: false,
          accounts: [],
          error: `Bank ${bankName} is not supported`
        };
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Return mock account data for demonstration
      const mockAccounts: Account[] = [];

      if (bankName === 'TD Canada Trust') {
        mockAccounts.push(
          {
            id: `td_demo_checking_${Date.now()}`,
            userId,
            bankName: 'TD Canada Trust',
            accountType: 'checking',
            accountNumber: '****1234',
            accountName: 'TD All-Inclusive Banking Plan',
            balance: 2548.75,
            currency: 'CAD',
            lastSync: new Date(),
            isActive: true
          },
          {
            id: `td_demo_savings_${Date.now()}`,
            userId,
            bankName: 'TD Canada Trust',
            accountType: 'savings',
            accountNumber: '****5678',
            accountName: 'TD Daily Interest Savings Account',
            balance: 12650.30,
            currency: 'CAD',
            lastSync: new Date(),
            isActive: true
          },
          {
            id: `td_demo_credit_${Date.now()}`,
            userId,
            bankName: 'TD Canada Trust',
            accountType: 'credit',
            accountNumber: '****9012',
            accountName: 'TD Cash Back Visa Card',
            balance: -856.42,
            currency: 'CAD',
            lastSync: new Date(),
            isActive: true
          }
        );
      }

      return {
        success: true,
        accounts: mockAccounts
      };
    }

    // Server-side implementation would go here
    return {
      success: false,
      accounts: [],
      error: 'Server-side banking integration not implemented yet. This feature requires a backend server to run browser automation securely.'
    };
  }

  async saveSelectedAccounts(userId: string, accounts: Account[]): Promise<Account[]> {
    try {
      // Ensure all accounts have the correct userId
      const accountsWithUserId = accounts.map(account => ({
        ...account,
        userId
      }));

      const savedAccounts = await accountService.saveAccounts(accountsWithUserId);
      return savedAccounts;
    } catch (error) {
      console.error('Failed to save accounts:', error);
      throw new Error('Failed to save selected accounts');
    }
  }

  async syncAccountTransactions(
    userId: string,
    accountIds: string[],
    dateRange: DateRange
  ): Promise<TransactionSyncResult> {
    if (!this.isNode) {
      // Mock implementation for browser environment
      console.log(`Mock: Syncing transactions for user ${userId}`, { accountIds, dateRange });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Return mock transaction data
      const mockTransactions: Transaction[] = accountIds.map((accountId, index) => ({
        id: `mock_tx_${accountId}_${index}_${Date.now()}`,
        userId,
        accountId,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        description: [
          'Coffee Shop Purchase',
          'Grocery Store',
          'Gas Station',
          'Online Purchase',
          'ATM Withdrawal'
        ][index % 5],
        amount: -(Math.random() * 100 + 10),
        category: 'other',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      return {
        success: true,
        transactions: mockTransactions,
        accountsUpdated: accountIds.length
      };
    }

    // Server-side implementation would handle real transaction syncing
    return {
      success: false,
      transactions: [],
      accountsUpdated: 0,
      error: 'Transaction syncing requires backend implementation'
    };
  }

  async refreshAccountBalances(userId: string): Promise<void> {
    try {
      const activeAccounts = await accountService.getActiveAccounts(userId);

      if (activeAccounts.length === 0) {
        return;
      }

      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const dateRange: DateRange = {
        startDate: yesterday,
        endDate: today
      };

      await this.syncAccountTransactions(
        userId,
        activeAccounts.map(acc => acc.id),
        dateRange
      );
    } catch (error) {
      console.error('Failed to refresh account balances:', error);
      throw new Error('Failed to refresh balances');
    }
  }

  async testBankConnection(bankName: string): Promise<boolean> {
    if (!this.isNode) {
      // Mock test in browser environment
      console.log(`Mock: Testing connection to ${bankName}`);

      const adapter = bankRegistry.getAdapter(bankName);
      if (!adapter) {
        return false;
      }

      // Simulate network test
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }

    // Server-side implementation would test real connectivity
    return false;
  }

  async getSupportedBanks(): Promise<string[]> {
    return bankRegistry.getSupportedBanks();
  }

  async isBankSupported(bankName: string): Promise<boolean> {
    return bankRegistry.isBankSupported(bankName);
  }

  // Cleanup method to ensure resources are released
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
}

// Export singleton instance
export const bankingService = BankingService.getInstance();

// Cleanup on process exit (Node.js only)
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  process.on('exit', () => {
    bankingService.cleanup();
  });
}