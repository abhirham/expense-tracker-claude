import { Account, Transaction, TransactionCategory } from '../../types';

const API_BASE_URL = '/api';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data.data;
  }

  // Banking API
  async getSupportedBanks() {
    return this.request<Array<{
      bankName: string;
      isActive: boolean;
      version: string;
      lastTested: Date;
      loginUrl: string;
    }>>('/banking/banks');
  }

  async connectToBank(bankName: string, credentials: { username: string; password: string }) {
    return this.request<Account[]>('/banking/connect', {
      method: 'POST',
      body: JSON.stringify({
        bankName,
        credentials
      })
    });
  }

  async fetchTransactions(accountId: string, dateRange: { startDate: Date; endDate: Date }) {
    return this.request<Transaction[]>('/banking/transactions', {
      method: 'POST',
      body: JSON.stringify({
        accountId,
        dateRange
      })
    });
  }

  // Transaction Categorization API
  async categorizeTransaction(description: string, amount: number, merchant?: string) {
    const result = await this.request<{ category: TransactionCategory }>('/transactions/categorize', {
      method: 'POST',
      body: JSON.stringify({
        description,
        amount,
        merchant
      })
    });
    return result.category;
  }

  async categorizeTransactionBatch(transactions: Array<{
    description: string;
    amount: number;
    merchant?: string;
  }>) {
    return this.request<TransactionCategory[]>('/transactions/categorize-batch', {
      method: 'POST',
      body: JSON.stringify({
        transactions
      })
    });
  }

  async getTransactionCategories() {
    return this.request<TransactionCategory[]>('/transactions/categories');
  }

  // Health check
  async healthCheck() {
    return this.request<{ message: string; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();