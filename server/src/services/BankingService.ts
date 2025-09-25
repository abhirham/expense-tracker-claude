import { chromium, Browser, Page } from 'playwright';
import {
  Account,
  Transaction,
  SessionCredentials,
  DateRange,
  BankConnectionResponse,
  TransactionFetchResponse
} from '../types/index.js';

// Import the banking system
import { bankRegistry } from './banking/index.js';

export class BankingService {
  private browser: Browser | null = null;

  constructor() {
    // Initialize the banking registry
    this.initializeBankAdapters();
  }

  private async initializeBankAdapters() {
    // Banking adapters are initialized in the banking/index.js file
    console.log('Banking service initialized');
  }

  async getSupportedBanks() {
    return bankRegistry.getAllSupportedBankInfo();
  }

  async connectToBank(bankName: string, credentials: SessionCredentials): Promise<BankConnectionResponse> {
    let page: Page | null = null;

    try {
      console.log(`Attempting to connect to ${bankName}...`);

      // Get the bank adapter
      const adapter = bankRegistry.getAdapter(bankName);
      if (!adapter) {
        return {
          success: false,
          error: `Bank ${bankName} is not supported`
        };
      }

      // Launch browser
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: false, // Set to true in production
          slowMo: 1000 // Add delay for testing
        });
      }

      page = await this.browser.newPage();

      // Set viewport and user agent
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to bank login page
      await page.goto(adapter.loginUrl);
      await page.waitForLoadState('networkidle');

      // Convert SessionCredentials to the expected format
      const sessionCreds = {
        sessionToken: `${credentials.username}:${credentials.password}`,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };

      // Perform login
      await adapter.login(page, sessionCreds);
      console.log(`Successfully logged in to ${bankName}`);

      // Get accounts
      const accounts = await adapter.getAccounts(page);
      console.log(`Found ${accounts.length} accounts for ${bankName}`);

      // Logout
      await adapter.logout(page);
      console.log(`Successfully logged out of ${bankName}`);

      return {
        success: true,
        accounts: accounts
      };

    } catch (error) {
      console.error(`Bank connection failed for ${bankName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async fetchTransactions(accountId: string, dateRange: DateRange): Promise<TransactionFetchResponse> {
    let page: Page | null = null;

    try {
      console.log(`Fetching transactions for account ${accountId}...`);

      // This would need to be implemented based on the stored account information
      // For now, return a placeholder response
      return {
        success: false,
        error: 'Transaction fetching not yet implemented'
      };

    } catch (error) {
      console.error(`Transaction fetch failed for account ${accountId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Cleanup on process exit
  setupCleanup() {
    process.on('SIGINT', async () => {
      console.log('Closing browser...');
      await this.closeBrowser();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Closing browser...');
      await this.closeBrowser();
      process.exit(0);
    });
  }
}