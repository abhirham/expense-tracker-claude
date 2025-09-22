import { Page } from 'playwright';
import { Account, Transaction, SessionCredentials, DateRange } from '../../../types';

export abstract class BaseBankAdapter {
  abstract readonly bankName: string;
  abstract readonly isSupported: boolean;
  abstract readonly loginUrl: string;

  constructor() {
    this.validateImplementation();
  }

  private validateImplementation(): void {
    if (!this.bankName) {
      throw new Error(`Bank adapter must define bankName`);
    }
    if (!this.loginUrl) {
      throw new Error(`Bank adapter for ${this.bankName} must define loginUrl`);
    }
  }

  // Abstract methods that each bank must implement
  abstract login(page: Page, credentials: SessionCredentials): Promise<void>;
  abstract getAccounts(page: Page): Promise<Account[]>;
  abstract getTransactions(
    page: Page,
    accountId: string,
    dateRange: DateRange
  ): Promise<Transaction[]>;
  abstract logout(page: Page): Promise<void>;

  // Common utility methods available to all bank adapters
  protected async waitForElement(
    page: Page,
    selector: string,
    timeout: number = 10000
  ): Promise<void> {
    try {
      await page.waitForSelector(selector, { timeout });
    } catch (error) {
      throw new Error(`Element ${selector} not found for ${this.bankName}: ${error}`);
    }
  }

  protected async safeClick(page: Page, selector: string): Promise<void> {
    try {
      await this.waitForElement(page, selector);
      await page.click(selector);
    } catch (error) {
      throw new Error(`Failed to click ${selector} for ${this.bankName}: ${error}`);
    }
  }

  protected async safeType(page: Page, selector: string, text: string): Promise<void> {
    try {
      await this.waitForElement(page, selector);
      await page.fill(selector, text);
    } catch (error) {
      throw new Error(`Failed to type in ${selector} for ${this.bankName}: ${error}`);
    }
  }

  protected async getText(page: Page, selector: string): Promise<string> {
    try {
      await this.waitForElement(page, selector);
      const element = await page.$(selector);
      return element ? await element.textContent() || '' : '';
    } catch (error) {
      throw new Error(`Failed to get text from ${selector} for ${this.bankName}: ${error}`);
    }
  }

  protected async getAllTexts(page: Page, selector: string): Promise<string[]> {
    try {
      await page.waitForSelector(selector);
      const elements = await page.$$(selector);
      const texts: string[] = [];
      for (const element of elements) {
        const text = await element.textContent();
        if (text) texts.push(text.trim());
      }
      return texts;
    } catch (error) {
      throw new Error(`Failed to get texts from ${selector} for ${this.bankName}: ${error}`);
    }
  }

  protected parseAmount(amountText: string): number {
    // Remove currency symbols, spaces, and commas
    const cleanAmount = amountText
      .replace(/[$,\s]/g, '')
      .replace(/[()]/g, '-'); // Handle negative amounts in parentheses

    const amount = parseFloat(cleanAmount);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount format: ${amountText}`);
    }
    return amount;
  }

  protected parseDate(dateText: string): Date {
    // Common Canadian date formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY
    const date = new Date(dateText);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateText}`);
    }
    return date;
  }

  protected generateTransactionId(
    accountId: string,
    date: Date,
    amount: number,
    description: string
  ): string {
    const dateStr = date.toISOString().split('T')[0];
    const amountStr = amount.toString().replace('.', '');
    const descHash = description.replace(/\s+/g, '').toLowerCase().slice(0, 10);
    return `${accountId}_${dateStr}_${amountStr}_${descHash}`;
  }

  // Error handling methods
  protected async handleLoginError(page: Page, error: Error): Promise<void> {
    const url = page.url();
    const title = await page.title();

    console.error(`Login error for ${this.bankName}:`, {
      error: error.message,
      url,
      title
    });

    // Check for common error indicators
    const errorMessages = await this.getAllTexts(page, '.error, .alert, .warning, [class*="error"]');
    if (errorMessages.length > 0) {
      throw new Error(`${this.bankName} login failed: ${errorMessages.join(', ')}`);
    }

    throw error;
  }

  protected async takeScreenshot(page: Page, name: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      try {
        await page.screenshot({
          path: `screenshots/${this.bankName}_${name}_${Date.now()}.png`,
          fullPage: true
        });
      } catch (error) {
        console.warn(`Failed to take screenshot: ${error}`);
      }
    }
  }

  // Validation methods
  protected validateDateRange(dateRange: DateRange): void {
    if (dateRange.startDate > dateRange.endDate) {
      throw new Error('Start date must be before end date');
    }

    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    if (dateRange.endDate.getTime() - dateRange.startDate.getTime() > maxRange) {
      throw new Error('Date range cannot exceed 1 year');
    }
  }

  protected validateAccount(account: Partial<Account>): void {
    if (!account.accountName || !account.accountType) {
      throw new Error('Account must have name and type');
    }
  }

  protected validateTransaction(transaction: Partial<Transaction>): void {
    if (!transaction.date || !transaction.description || transaction.amount === undefined) {
      throw new Error('Transaction must have date, description, and amount');
    }
  }
}