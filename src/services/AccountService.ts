import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Account } from '../types';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';

export class AccountService {
  private static instance: AccountService;

  private constructor() {}

  public static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService();
    }
    return AccountService.instance;
  }

  private encryptAccountNumber(accountNumber: string): string {
    return CryptoJS.AES.encrypt(accountNumber, ENCRYPTION_KEY).toString();
  }

  private decryptAccountNumber(encryptedAccountNumber: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedAccountNumber, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return encryptedAccountNumber; // Return as-is if decryption fails
    }
  }

  async getUserAccounts(userId: string): Promise<Account[]> {
    try {
      const accountsRef = collection(db, 'accounts');
      const q = query(
        accountsRef,
        where('userId', '==', userId),
        orderBy('bankName'),
        orderBy('accountName')
      );

      const querySnapshot = await getDocs(q);
      const accounts: Account[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const account: Account = {
          id: doc.id,
          userId: data.userId,
          bankName: data.bankName,
          accountType: data.accountType,
          accountNumber: this.decryptAccountNumber(data.accountNumber),
          accountName: data.accountName,
          balance: data.balance,
          currency: data.currency,
          lastSync: data.lastSync?.toDate() || new Date(),
          isActive: data.isActive
        };
        accounts.push(account);
      });

      return accounts;
    } catch (error) {
      console.error('Error getting user accounts:', error);
      throw new Error('Failed to retrieve accounts');
    }
  }

  async saveAccounts(accounts: Account[]): Promise<Account[]> {
    try {
      const savedAccounts: Account[] = [];

      for (const account of accounts) {
        const accountData = {
          userId: account.userId,
          bankName: account.bankName,
          accountType: account.accountType,
          accountNumber: this.encryptAccountNumber(account.accountNumber),
          accountName: account.accountName,
          balance: account.balance,
          currency: account.currency,
          lastSync: Timestamp.fromDate(account.lastSync),
          isActive: account.isActive
        };

        const accountsRef = collection(db, 'accounts');
        const docRef = await addDoc(accountsRef, accountData);

        const savedAccount: Account = {
          ...account,
          id: docRef.id
        };

        savedAccounts.push(savedAccount);

        // Create audit log
        await this.createAuditLog(account.userId, 'account.linked', 'account', docRef.id, {
          bankName: account.bankName,
          accountName: account.accountName,
          accountType: account.accountType
        });
      }

      return savedAccounts;
    } catch (error) {
      console.error('Error saving accounts:', error);
      throw new Error('Failed to save accounts');
    }
  }

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<void> {
    try {
      const accountRef = doc(db, 'accounts', accountId);

      const updateData: Record<string, unknown> = {};
      if (updates.balance !== undefined) updateData.balance = updates.balance;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.lastSync) updateData.lastSync = Timestamp.fromDate(updates.lastSync);
      if (updates.accountName) updateData.accountName = updates.accountName;

      await updateDoc(accountRef, updateData);
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error('Failed to update account');
    }
  }

  async deleteAccount(userId: string, accountId: string): Promise<void> {
    try {
      // Get account details for audit log
      const accounts = await this.getUserAccounts(userId);
      const account = accounts.find(acc => acc.id === accountId);

      const accountRef = doc(db, 'accounts', accountId);
      await deleteDoc(accountRef);

      // Create audit log
      if (account) {
        await this.createAuditLog(userId, 'account.unlinked', 'account', accountId, {
          bankName: account.bankName,
          accountName: account.accountName,
          accountType: account.accountType
        });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  }

  async getAccountsByBank(userId: string, bankName: string): Promise<Account[]> {
    try {
      const accountsRef = collection(db, 'accounts');
      const q = query(
        accountsRef,
        where('userId', '==', userId),
        where('bankName', '==', bankName),
        orderBy('accountName')
      );

      const querySnapshot = await getDocs(q);
      const accounts: Account[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const account: Account = {
          id: doc.id,
          userId: data.userId,
          bankName: data.bankName,
          accountType: data.accountType,
          accountNumber: this.decryptAccountNumber(data.accountNumber),
          accountName: data.accountName,
          balance: data.balance,
          currency: data.currency,
          lastSync: data.lastSync?.toDate() || new Date(),
          isActive: data.isActive
        };
        accounts.push(account);
      });

      return accounts;
    } catch (error) {
      console.error('Error getting accounts by bank:', error);
      throw new Error('Failed to retrieve bank accounts');
    }
  }

  async updateAccountBalance(accountId: string, newBalance: number): Promise<void> {
    try {
      await this.updateAccount(accountId, {
        balance: newBalance,
        lastSync: new Date()
      });
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw new Error('Failed to update account balance');
    }
  }

  async setAccountActive(accountId: string, isActive: boolean): Promise<void> {
    try {
      await this.updateAccount(accountId, { isActive });
    } catch (error) {
      console.error('Error updating account status:', error);
      throw new Error('Failed to update account status');
    }
  }

  async getActiveAccounts(userId: string): Promise<Account[]> {
    const allAccounts = await this.getUserAccounts(userId);
    return allAccounts.filter(account => account.isActive);
  }

  async getAccountSummary(userId: string): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    totalBalance: number;
    byBank: { [bankName: string]: number };
    byType: { [accountType: string]: number };
  }> {
    try {
      const accounts = await this.getUserAccounts(userId);

      const summary = {
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(acc => acc.isActive).length,
        totalBalance: 0,
        byBank: {} as { [bankName: string]: number },
        byType: {} as { [accountType: string]: number }
      };

      accounts.forEach(account => {
        if (account.isActive) {
          summary.totalBalance += account.balance;

          summary.byBank[account.bankName] = (summary.byBank[account.bankName] || 0) + account.balance;
          summary.byType[account.accountType] = (summary.byType[account.accountType] || 0) + account.balance;
        }
      });

      return summary;
    } catch (error) {
      console.error('Error getting account summary:', error);
      throw new Error('Failed to get account summary');
    }
  }

  private async createAuditLog(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      const auditLogData = {
        userId,
        action,
        resource,
        resourceId,
        details: details || {},
        timestamp: Timestamp.now(),
        ipAddress: '', // Would be populated by backend
        userAgent: navigator.userAgent
      };

      const auditLogsRef = collection(db, 'auditLogs');
      await addDoc(auditLogsRef, auditLogData);
    } catch (error) {
      console.warn('Failed to create audit log:', error);
      // Don't throw - audit logging shouldn't break functionality
    }
  }

  // Helper method to validate account data
  validateAccount(account: Partial<Account>): boolean {
    return !!(
      account.bankName &&
      account.accountName &&
      account.accountType &&
      account.accountNumber &&
      typeof account.balance === 'number' &&
      account.currency
    );
  }

  // Helper method to sanitize account data for display
  getSanitizedAccount(account: Account): Omit<Account, 'accountNumber'> & { maskedAccountNumber: string } {
    return {
      ...account,
      maskedAccountNumber: account.accountNumber.includes('*')
        ? account.accountNumber
        : `****${account.accountNumber.slice(-4)}`
    };
  }
}

// Export singleton instance
export const accountService = AccountService.getInstance();