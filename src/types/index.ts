import { Page } from 'playwright';

// User Management Types
export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  lastLogin?: Date;
}

// Banking Types
export interface Account {
  id: string;
  userId: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  accountNumber: string; // Encrypted
  accountName: string;
  balance: number;
  currency: 'CAD';
  lastSync: Date;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  date: Date;
  description: string;
  amount: number; // Positive for income, negative for expenses
  category: TransactionCategory;
  originalCategory?: string; // Original bank category
  merchant?: string;
  notes?: string;
  isRecurring?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Categories
export type TransactionCategory =
  | 'housing'
  | 'transportation'
  | 'food-dining'
  | 'entertainment'
  | 'healthcare'
  | 'shopping'
  | 'financial-services'
  | 'income'
  | 'other';

export interface CategoryInfo {
  id: TransactionCategory;
  name: string;
  description: string;
  color: string;
  icon: string;
}

// Banking Integration Types
export interface SessionCredentials {
  sessionToken?: string;
  timestamp: Date;
  expiresAt: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface BankAdapter {
  bankName: string;
  isSupported: boolean;
  login(page: Page, credentials: SessionCredentials): Promise<void>;
  getAccounts(page: Page): Promise<Account[]>;
  getTransactions(page: Page, accountId: string, dateRange: DateRange): Promise<Transaction[]>;
  logout(page: Page): Promise<void>;
}

export interface SupportedBank {
  bankName: string;
  isActive: boolean;
  version: string;
  lastTested: Date;
  adapterClass: string;
  loginUrl: string;
  features: BankFeature[];
}

export interface BankFeature {
  name: string;
  supported: boolean;
  description: string;
}

// Data Processing Types
export interface TransactionParseResult {
  transactions: Transaction[];
  errors: ParseError[];
  summary: {
    totalProcessed: number;
    totalErrors: number;
    dateRange: DateRange;
  };
}

export interface ParseError {
  row: number;
  field: string;
  value: unknown;
  error: string;
}

// Reporting Types
export interface FinancialSummary {
  userId: string;
  period: DateRange;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  categoryBreakdown: CategorySummary[];
  accountSummaries: AccountSummary[];
}

export interface CategorySummary {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface AccountSummary {
  accountId: string;
  bankName: string;
  accountName: string;
  totalTransactions: number;
  totalAmount: number;
  lastTransaction: Date;
}

// UI Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: Date;
}

// Authentication Types
export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

// Audit and Compliance Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'account.linked'
  | 'account.unlinked'
  | 'transactions.imported'
  | 'data.exported'
  | 'category.changed'
  | 'data.deleted';