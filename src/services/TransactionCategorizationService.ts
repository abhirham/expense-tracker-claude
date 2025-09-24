import { TransactionCategory } from '../types';

export interface TransactionData {
  merchant: string;
  description: string;
  amount: number;
  date: Date;
  id?: string;
}

export interface CategorizationResult {
  category: TransactionCategory;
  confidence: number;
  source: 'claude' | 'cache' | 'default';
}

export interface CachedCategorization {
  merchant: string;
  category: TransactionCategory;
  confidence: number;
  usageCount: number;
  lastUsed: Date;
}

export class TransactionCategorizationService {
  private static instance: TransactionCategorizationService;
  private merchantCache: Map<string, CachedCategorization> = new Map();
  private readonly claudeApiKey: string;
  private readonly claudeApiUrl = 'https://api.anthropic.com/v1/messages';

  // All valid categories for validation
  private readonly validCategories: TransactionCategory[] = [
    'Restaurants', 'Groceries', 'Car', 'Entertainment', 'Coffee Shop',
    'Shopping', 'Home', 'Cne', 'Transport', 'Health', 'Pets',
    'Misc', 'Family', 'Personal Care', 'Financial', 'Utilities'
  ];

  private constructor() {
    this.claudeApiKey = import.meta.env.VITE_CLAUDE_API_KEY || '';
    this.loadCacheFromStorage();
  }

  public static getInstance(): TransactionCategorizationService {
    if (!TransactionCategorizationService.instance) {
      TransactionCategorizationService.instance = new TransactionCategorizationService();
    }
    return TransactionCategorizationService.instance;
  }

  async categorizeTransaction(transaction: TransactionData): Promise<CategorizationResult> {
    // First check cache
    const cachedResult = this.getCachedCategorization(transaction.merchant);
    if (cachedResult) {
      return {
        category: cachedResult.category,
        confidence: cachedResult.confidence,
        source: 'cache'
      };
    }

    // If no Claude API key, return default
    if (!this.claudeApiKey || this.claudeApiKey === 'your-claude-api-key-here') {
      return {
        category: 'Misc',
        confidence: 0.1,
        source: 'default'
      };
    }

    try {
      const category = await this.callClaudeAPI(transaction);
      const result: CategorizationResult = {
        category,
        confidence: 0.9,
        source: 'claude'
      };

      // Cache the result
      this.cacheResult(transaction.merchant, category, 0.9);

      return result;
    } catch (error) {
      console.error('Claude API categorization failed:', error);

      // Fallback to basic keyword matching
      const fallbackCategory = this.basicKeywordMatching(transaction);
      return {
        category: fallbackCategory,
        confidence: 0.3,
        source: 'default'
      };
    }
  }

  async categorizeBatch(transactions: TransactionData[]): Promise<CategorizationResult[]> {
    const results: CategorizationResult[] = [];

    // Group transactions by uncached merchants to batch API calls
    const uncachedTransactions: TransactionData[] = [];

    for (const transaction of transactions) {
      const cached = this.getCachedCategorization(transaction.merchant);
      if (cached) {
        results.push({
          category: cached.category,
          confidence: cached.confidence,
          source: 'cache'
        });
      } else {
        uncachedTransactions.push(transaction);
        results.push({ category: 'Misc', confidence: 0, source: 'default' }); // Placeholder
      }
    }

    // Process uncached transactions
    if (uncachedTransactions.length > 0 && this.claudeApiKey && this.claudeApiKey !== 'your-claude-api-key-here') {
      try {
        for (let i = 0; i < uncachedTransactions.length; i++) {
          const transaction = uncachedTransactions[i];
          const category = await this.callClaudeAPI(transaction);

          // Find original index and update result
          const originalIndex = transactions.findIndex(t => t === transaction);
          results[originalIndex] = {
            category,
            confidence: 0.9,
            source: 'claude'
          };

          // Cache result
          this.cacheResult(transaction.merchant, category, 0.9);
        }
      } catch (error) {
        console.error('Batch categorization failed:', error);
        // Fallback to keyword matching for uncached
        for (let i = 0; i < uncachedTransactions.length; i++) {
          const transaction = uncachedTransactions[i];
          const fallbackCategory = this.basicKeywordMatching(transaction);
          const originalIndex = transactions.findIndex(t => t === transaction);
          results[originalIndex] = {
            category: fallbackCategory,
            confidence: 0.3,
            source: 'default'
          };
        }
      }
    }

    return results;
  }

  private async callClaudeAPI(transaction: TransactionData): Promise<TransactionCategory> {
    const prompt = this.createCategorizationPrompt(transaction);

    const response = await fetch(this.claudeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fast and cost-effective model
        max_tokens: 50,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const categoryText = data.content[0].text.trim();

    // Validate and return category
    const category = this.validateCategory(categoryText);
    return category;
  }

  private createCategorizationPrompt(transaction: TransactionData): string {
    const categories = this.validCategories.join(', ');
    const amount = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(Math.abs(transaction.amount));

    return `You are a Canadian personal finance expert. Categorize this transaction into exactly ONE of these categories:
${categories}

Transaction Details:
- Merchant: ${transaction.merchant}
- Description: ${transaction.description}
- Amount: ${amount}
- Date: ${transaction.date.toLocaleDateString('en-CA')}

Consider Canadian context:
- Tim Hortons, Second Cup = Coffee Shop
- Loblaws, Metro, Sobeys, Save-On-Foods = Groceries
- Canadian Tire, Winners, Hudson's Bay = Shopping
- Petro-Canada, Shell, Esso = Car
- TTC, GO Transit, Via Rail = Transport
- Shoppers Drug Mart = Health (if pharmacy) or Personal Care (if cosmetics)
- Rogers, Bell, Hydro, Enbridge = Utilities
- CRA, banks, insurance = Financial

Respond with ONLY the exact category name from the list above.`;
  }

  private validateCategory(categoryText: string): TransactionCategory {
    // Find exact match first
    const exactMatch = this.validCategories.find(cat =>
      cat.toLowerCase() === categoryText.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch;
    }

    // Find partial match
    const partialMatch = this.validCategories.find(cat =>
      categoryText.toLowerCase().includes(cat.toLowerCase()) ||
      cat.toLowerCase().includes(categoryText.toLowerCase())
    );

    return partialMatch || 'Misc';
  }

  private getCachedCategorization(merchant: string): CachedCategorization | null {
    const normalizedMerchant = this.normalizeMerchant(merchant);
    const cached = this.merchantCache.get(normalizedMerchant);

    if (cached) {
      // Update usage stats
      cached.usageCount++;
      cached.lastUsed = new Date();
      this.saveCacheToStorage();
      return cached;
    }

    return null;
  }

  private cacheResult(merchant: string, category: TransactionCategory, confidence: number): void {
    const normalizedMerchant = this.normalizeMerchant(merchant);

    this.merchantCache.set(normalizedMerchant, {
      merchant: normalizedMerchant,
      category,
      confidence,
      usageCount: 1,
      lastUsed: new Date()
    });

    this.saveCacheToStorage();
  }

  private normalizeMerchant(merchant: string): string {
    return merchant
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  private basicKeywordMatching(transaction: TransactionData): TransactionCategory {
    const text = `${transaction.merchant} ${transaction.description}`.toLowerCase();

    // Canadian-specific patterns
    if (text.match(/tim hortons|second cup|starbucks|coffee/)) return 'Coffee Shop';
    if (text.match(/loblaws|metro|sobeys|save-on-foods|grocery|supermarket/)) return 'Groceries';
    if (text.match(/restaurant|dining|pizza|mcdonalds|burger|food/)) return 'Restaurants';
    if (text.match(/petro-?canada|shell|esso|gas|fuel/)) return 'Car';
    if (text.match(/ttc|go transit|via rail|uber|taxi|transport/)) return 'Transport';
    if (text.match(/rogers|bell|telus|hydro|enbridge|utility|utilities/)) return 'Utilities';
    if (text.match(/canadian tire|winners|hudson bay|walmart|shopping/)) return 'Shopping';
    if (text.match(/shoppers drug mart|pharmacy|medical|health/)) return 'Health';
    if (text.match(/movie|cinema|entertainment|netflix|spotify/)) return 'Entertainment';
    if (text.match(/bank|insurance|financial|cra|tax/)) return 'Financial';
    if (text.match(/rent|mortgage|home|house|maintenance/)) return 'Home';

    return 'Misc';
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem('transaction_categorization_cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.merchantCache = new Map(data.map((item: any) => [
          item.merchant,
          {
            ...item,
            lastUsed: new Date(item.lastUsed)
          }
        ]));
      }
    } catch (error) {
      console.warn('Failed to load categorization cache:', error);
    }
  }

  private saveCacheToStorage(): void {
    try {
      const data = Array.from(this.merchantCache.values());
      localStorage.setItem('transaction_categorization_cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save categorization cache:', error);
    }
  }

  // Utility methods for management
  clearCache(): void {
    this.merchantCache.clear();
    localStorage.removeItem('transaction_categorization_cache');
  }

  getCacheStats(): { size: number; totalUsage: number; oldestEntry: Date | null } {
    const entries = Array.from(this.merchantCache.values());
    return {
      size: entries.length,
      totalUsage: entries.reduce((sum, entry) => sum + entry.usageCount, 0),
      oldestEntry: entries.length > 0
        ? new Date(Math.min(...entries.map(e => e.lastUsed.getTime())))
        : null
    };
  }

  // Manual categorization override (for user corrections)
  overrideCategory(merchant: string, category: TransactionCategory): void {
    this.cacheResult(merchant, category, 1.0); // High confidence for manual override
  }
}

// Export singleton instance
export const transactionCategorizationService = TransactionCategorizationService.getInstance();