import Anthropic from '@anthropic-ai/sdk';
import { Transaction, TransactionCategory } from '../types/index.js';

interface TransactionForCategorization {
  description: string;
  amount: number;
  merchant?: string;
}

export class TransactionCategorizationService {
  private anthropic: Anthropic;

  private readonly VALID_CATEGORIES: TransactionCategory[] = [
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

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey
    });
  }

  async categorizeTransaction(transaction: TransactionForCategorization): Promise<TransactionCategory> {
    try {
      const prompt = this.buildCategorizationPrompt([transaction]);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const result = content.text.trim();
      const category = this.parseCategorizationResponse(result, 1)[0];

      return category;
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      return 'Misc'; // Default fallback category
    }
  }

  async categorizeTransactionBatch(transactions: TransactionForCategorization[]): Promise<TransactionCategory[]> {
    try {
      if (transactions.length === 0) {
        return [];
      }

      const prompt = this.buildCategorizationPrompt(transactions);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const result = content.text.trim();
      const categories = this.parseCategorizationResponse(result, transactions.length);

      return categories;
    } catch (error) {
      console.error('Error categorizing transaction batch:', error);
      // Return all 'Misc' as fallback
      return new Array(transactions.length).fill('Misc' as TransactionCategory);
    }
  }

  private buildCategorizationPrompt(transactions: TransactionForCategorization[]): string {
    const categoriesList = this.VALID_CATEGORIES.join(', ');

    let prompt = `You are a Canadian personal finance transaction categorizer. You must categorize transactions into EXACTLY one of these categories (no other categories allowed):

${categoriesList}

Rules:
- You MUST use exactly one of the categories above
- If uncertain, use "Misc"
- Consider Canadian context (CAD currency, Canadian merchants)
- "Cne" refers to Canadian National Exhibition or similar events

${transactions.length === 1 ? 'Transaction' : 'Transactions'} to categorize:

`;

    transactions.forEach((transaction, index) => {
      prompt += `${index + 1}. Description: "${transaction.description}"`;
      if (transaction.merchant) {
        prompt += `, Merchant: "${transaction.merchant}"`;
      }
      prompt += `, Amount: $${Math.abs(transaction.amount).toFixed(2)}\n`;
    });

    if (transactions.length === 1) {
      prompt += '\nRespond with just the category name, nothing else.';
    } else {
      prompt += `\nRespond with exactly ${transactions.length} category names, one per line, in the same order as the transactions above.`;
    }

    return prompt;
  }

  private parseCategorizationResponse(response: string, expectedCount: number): TransactionCategory[] {
    const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const categories: TransactionCategory[] = [];

    for (let i = 0; i < expectedCount; i++) {
      let categoryText = lines[i] || 'Misc';

      // Clean up the response (remove numbers, periods, etc.)
      categoryText = categoryText.replace(/^\d+\.\s*/, '').trim();

      // Find matching category (case-insensitive)
      const matchedCategory = this.VALID_CATEGORIES.find(
        cat => cat.toLowerCase() === categoryText.toLowerCase()
      );

      categories.push(matchedCategory || 'Misc');
    }

    return categories;
  }
}