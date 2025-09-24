// Mock Page interface for browser compatibility
interface PageElement {
  textContent: () => Promise<string | null>;
  $: (selector: string) => Promise<PageElement | null>;
  click: () => Promise<void>;
  fill: (text: string) => Promise<void>;
}

interface Page {
  goto: (url: string) => Promise<void>;
  waitForSelector: (selector: string, options?: { timeout?: number }) => Promise<void>;
  waitForTimeout: (timeout: number) => Promise<void>;
  $: (selector: string) => Promise<PageElement | null>;
  $$: (selector: string) => Promise<PageElement[]>;
  title: () => Promise<string>;
  url: () => string;
  screenshot: (options: { path: string; fullPage?: boolean }) => Promise<void>;
  fill: (selector: string, text: string) => Promise<void>;
  click: (selector: string) => Promise<void>;
  close: () => Promise<void>;
  textContent: () => Promise<string | null>;
}
import { BaseBankAdapter } from '../base/BankAdapter';
import { Account, Transaction, SessionCredentials, DateRange } from '../../../types';

export class TDBankAdapter extends BaseBankAdapter {
  readonly bankName = 'TD Canada Trust';
  readonly isSupported = true;
  readonly loginUrl = 'https://easyweb.td.com';

  async login(page: Page, credentials: SessionCredentials): Promise<void> {
    try {
      console.log('Using credentials timestamp:', credentials.timestamp);
      await page.goto(this.loginUrl);
      await this.waitForElement(page, '#userid');

      // Wait for user to manually enter credentials
      console.log('Please log in to TD Canada Trust manually...');

      // Wait for successful login (check for dashboard elements)
      await page.waitForSelector([
        '[data-testid="account-tile"]',
        '.account-tile',
        '#account-summary',
        '.accounts-overview'
      ].join(','), { timeout: 120000 });

      console.log('TD Bank login successful');
    } catch (error) {
      await this.handleLoginError(page, error as Error);
    }
  }

  async getAccounts(page: Page): Promise<Account[]> {
    try {
      const accounts: Account[] = [];

      // Wait for accounts to load
      await this.waitForElement(page, '[data-testid="account-tile"], .account-tile, .account-summary-item');

      // Get account elements - TD uses different selectors
      const accountElements = await page.$$('[data-testid="account-tile"], .account-tile, .account-summary-item');

      for (let i = 0; i < accountElements.length; i++) {
        const element = accountElements[i];

        try {
          // Extract account information
          const accountNameElement = await element.$('.account-name, .account-title, [data-testid="account-name"]');
          const accountTypeElement = await element.$('.account-type, [data-testid="account-type"]');
          const balanceElement = await element.$('.balance, .account-balance, [data-testid="balance"]');
          const accountNumberElement = await element.$('.account-number, [data-testid="account-number"]');

          if (!accountNameElement) continue;

          const accountName = (await accountNameElement.textContent())?.trim() || `Account ${i + 1}`;
          const accountTypeText = (await accountTypeElement?.textContent())?.trim() || '';
          const balanceText = (await balanceElement?.textContent())?.trim() || '$0.00';
          const accountNumberText = (await accountNumberElement?.textContent())?.trim() || '';

          // Parse account type
          const accountType = this.parseAccountType(accountTypeText, accountName);

          // Parse balance
          const balance = this.parseAmount(balanceText);

          // Extract account number (last 4 digits typically shown)
          const accountNumber = this.extractAccountNumber(accountNumberText, accountName);

          const account: Account = {
            id: `td_${this.generateAccountId(accountName, accountNumber)}`,
            userId: '', // Will be set by the service
            bankName: this.bankName,
            accountType,
            accountNumber,
            accountName,
            balance,
            currency: 'CAD',
            lastSync: new Date(),
            isActive: true
          };

          this.validateAccount(account);
          accounts.push(account);
        } catch (error) {
          console.warn(`Failed to parse TD account ${i}:`, error);
        }
      }

      if (accounts.length === 0) {
        throw new Error('No TD accounts found');
      }

      return accounts;
    } catch (error) {
      await this.takeScreenshot(page, 'getAccounts_error');
      throw new Error(`Failed to get TD accounts: ${error}`);
    }
  }

  async getTransactions(page: Page, accountId: string, dateRange: DateRange): Promise<Transaction[]> {
    try {
      this.validateDateRange(dateRange);

      // Navigate to specific account transactions
      await this.navigateToAccountTransactions(page, accountId);

      // Set date range if possible
      await this.setDateRange(page, dateRange);

      const transactions: Transaction[] = [];

      // Wait for transaction table/list
      await this.waitForElement(page, '.transaction-row, .transaction-item, [data-testid="transaction"]');

      const transactionElements = await page.$$('.transaction-row, .transaction-item, [data-testid="transaction"]');

      for (let i = 0; i < transactionElements.length; i++) {
        const element = transactionElements[i];

        try {
          const dateElement = await element.$('.transaction-date, [data-testid="transaction-date"]');
          const descElement = await element.$('.transaction-description, [data-testid="description"]');
          const amountElement = await element.$('.transaction-amount, [data-testid="amount"]');

          if (!dateElement || !descElement || !amountElement) continue;

          const dateText = (await dateElement.textContent())?.trim() || '';
          const description = (await descElement.textContent())?.trim() || '';
          const amountText = (await amountElement.textContent())?.trim() || '';

          const date = this.parseDate(dateText);
          const amount = this.parseAmount(amountText);

          // Skip transactions outside date range
          if (date < dateRange.startDate || date > dateRange.endDate) {
            continue;
          }

          const transaction: Transaction = {
            id: this.generateTransactionId(accountId, date, amount, description),
            userId: '', // Will be set by the service
            accountId,
            date,
            description: description.substring(0, 100), // Limit description length
            amount,
            category: 'Misc', // Default category, will be categorized later
            createdAt: new Date(),
            updatedAt: new Date()
          };

          this.validateTransaction(transaction);
          transactions.push(transaction);
        } catch (error) {
          console.warn(`Failed to parse TD transaction ${i}:`, error);
        }
      }

      return transactions;
    } catch (error) {
      await this.takeScreenshot(page, 'getTransactions_error');
      throw new Error(`Failed to get TD transactions: ${error}`);
    }
  }

  async logout(page: Page): Promise<void> {
    try {
      // Look for logout button/link
      const logoutSelectors = [
        '[data-testid="logout"]',
        '.logout',
        'a[href*="logout"]',
        'button[title*="Log Out"]',
        'button[aria-label*="Log Out"]'
      ];

      for (const selector of logoutSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          await this.safeClick(page, selector);

          // Wait for logout confirmation
          await page.waitForSelector('#userid, .login-form', { timeout: 10000 });
          console.log('TD Bank logout successful');
          return;
        } catch {
          continue;
        }
      }

      // If logout button not found, close the page
      console.warn('TD logout button not found, closing page');
      await page.close();
    } catch (error) {
      console.warn('TD logout failed:', error);
      await page.close();
    }
  }

  private parseAccountType(accountTypeText: string, accountName: string): Account['accountType'] {
    const text = (accountTypeText + ' ' + accountName).toLowerCase();

    if (text.includes('chequing') || text.includes('checking')) return 'checking';
    if (text.includes('savings')) return 'savings';
    if (text.includes('credit') || text.includes('visa') || text.includes('mastercard')) return 'credit';
    if (text.includes('investment') || text.includes('tfsa') || text.includes('rrsp')) return 'investment';

    return 'other';
  }

  private extractAccountNumber(accountNumberText: string, accountName: string): string {
    // Extract digits from account number text
    const digits = accountNumberText.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `****${digits.slice(-4)}`;
    }

    // Fallback to account name hash
    return `****${accountName.replace(/\D/g, '').slice(-4) || '0000'}`;
  }

  private generateAccountId(accountName: string, accountNumber: string): string {
    const nameHash = accountName.replace(/\s+/g, '').toLowerCase().slice(0, 8);
    const numberHash = accountNumber.replace(/\*/g, '').slice(-4);
    return `${nameHash}_${numberHash}`;
  }

  private async navigateToAccountTransactions(page: Page, accountId: string): Promise<void> {
    // Try to click on account to view transactions
    const accountSelectors = [
      `[data-account-id="${accountId}"]`,
      '.account-tile',
      '[data-testid="account-tile"]',
      '.account-summary-item'
    ];

    for (const selector of accountSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          await elements[0].click();
          await page.waitForTimeout(2000);
          break;
        }
      } catch {
        continue;
      }
    }
  }

  private async setDateRange(page: Page, dateRange: DateRange): Promise<void> {
    try {
      // Look for date range controls
      const dateFromSelector = 'input[type="date"], input[name*="from"], input[id*="from"]';
      const dateToSelector = 'input[type="date"], input[name*="to"], input[id*="to"]';

      const fromInput = await page.$(dateFromSelector);
      const toInput = await page.$(dateToSelector);

      if (fromInput && toInput) {
        await fromInput.fill(dateRange.startDate.toISOString().split('T')[0]);
        await toInput.fill(dateRange.endDate.toISOString().split('T')[0]);

        // Look for apply/submit button
        const applyButton = await page.$('button[type="submit"], .apply-btn, [data-testid="apply"]');
        if (applyButton) {
          await applyButton.click();
          await page.waitForTimeout(2000);
        }
      }
    } catch (error) {
      console.warn('Failed to set TD date range:', error);
    }
  }
}