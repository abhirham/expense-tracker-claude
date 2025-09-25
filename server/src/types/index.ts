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

// Transaction Categories - EXACTLY as specified by user
export type TransactionCategory =
  | 'Restaurants'
  | 'Groceries'
  | 'Car'
  | 'Entertainment'
  | 'Coffee Shop'
  | 'Shopping'
  | 'Home'
  | 'Cne'
  | 'Transport'
  | 'Health'
  | 'Pets'
  | 'Misc'
  | 'Family'
  | 'Personal Care'
  | 'Financial'
  | 'Utilities';

// Banking Integration Types
export interface SessionCredentials {
  username: string;
  password: string;
  securityAnswers?: Record<string, string>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface BankConnectionRequest {
  bankName: string;
  credentials: SessionCredentials;
}

export interface BankConnectionResponse {
  success: boolean;
  accounts?: Account[];
  error?: string;
}

export interface TransactionFetchRequest {
  accountId: string;
  dateRange: DateRange;
}

export interface TransactionFetchResponse {
  success: boolean;
  transactions?: Transaction[];
  error?: string;
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