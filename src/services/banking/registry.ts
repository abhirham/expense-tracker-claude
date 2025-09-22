import { BaseBankAdapter } from './base/BankAdapter';
import { SupportedBank } from '../../types';

export class BankRegistry {
  private static instance: BankRegistry;
  private adapters: Map<string, BaseBankAdapter> = new Map();
  private supportedBanks: Map<string, SupportedBank> = new Map();

  private constructor() {
    this.initializeRegistry();
  }

  public static getInstance(): BankRegistry {
    if (!BankRegistry.instance) {
      BankRegistry.instance = new BankRegistry();
    }
    return BankRegistry.instance;
  }

  private initializeRegistry(): void {
    // Initialize with empty registry
    // Banks will be registered as they are implemented
    console.log('Banking registry initialized');
  }

  public register(adapter: BaseBankAdapter): void {
    if (!adapter.bankName) {
      throw new Error('Bank adapter must have a bankName');
    }

    if (this.adapters.has(adapter.bankName)) {
      console.warn(`Overriding existing adapter for ${adapter.bankName}`);
    }

    this.adapters.set(adapter.bankName, adapter);

    // Create supported bank entry
    const supportedBank: SupportedBank = {
      bankName: adapter.bankName,
      isActive: adapter.isSupported,
      version: '1.0.0',
      lastTested: new Date(),
      adapterClass: adapter.constructor.name,
      loginUrl: adapter.loginUrl,
      features: [
        {
          name: 'Account Listing',
          supported: true,
          description: 'List all user accounts'
        },
        {
          name: 'Transaction History',
          supported: true,
          description: 'Retrieve transaction history'
        },
        {
          name: '2FA Support',
          supported: true,
          description: 'Handle two-factor authentication'
        }
      ]
    };

    this.supportedBanks.set(adapter.bankName, supportedBank);

    console.log(`Registered bank adapter: ${adapter.bankName}`);
  }

  public getAdapter(bankName: string): BaseBankAdapter | null {
    const adapter = this.adapters.get(bankName);
    return adapter || null;
  }

  public getSupportedBanks(): string[] {
    return Array.from(this.adapters.keys()).filter(bankName => {
      const adapter = this.adapters.get(bankName);
      return adapter?.isSupported;
    });
  }

  public getAllBanks(): string[] {
    return Array.from(this.adapters.keys());
  }

  public getSupportedBankInfo(bankName: string): SupportedBank | null {
    return this.supportedBanks.get(bankName) || null;
  }

  public getAllSupportedBankInfo(): SupportedBank[] {
    return Array.from(this.supportedBanks.values()).filter(bank => bank.isActive);
  }

  public isBankSupported(bankName: string): boolean {
    const adapter = this.adapters.get(bankName);
    return adapter?.isSupported || false;
  }

  public unregister(bankName: string): boolean {
    const removed = this.adapters.delete(bankName);
    this.supportedBanks.delete(bankName);
    if (removed) {
      console.log(`Unregistered bank adapter: ${bankName}`);
    }
    return removed;
  }

  public updateBankStatus(bankName: string, isActive: boolean): void {
    const bank = this.supportedBanks.get(bankName);
    if (bank) {
      bank.isActive = isActive;
      bank.lastTested = new Date();
    }

    const adapter = this.adapters.get(bankName);
    if (adapter) {
      // Note: isSupported is readonly, so we can't modify it directly
      // This would require the adapter to have a mutable status property
      console.log(`Updated status for ${bankName}: ${isActive ? 'active' : 'inactive'}`);
    }
  }

  public getRegistryStats(): {
    totalBanks: number;
    activeBanks: number;
    inactiveBanks: number;
    lastUpdate: Date;
  } {
    const totalBanks = this.adapters.size;
    const activeBanks = this.getSupportedBanks().length;
    const inactiveBanks = totalBanks - activeBanks;

    return {
      totalBanks,
      activeBanks,
      inactiveBanks,
      lastUpdate: new Date()
    };
  }

  // Development helper methods
  public clearRegistry(): void {
    this.adapters.clear();
    this.supportedBanks.clear();
    console.log('Bank registry cleared');
  }

  public listAdapters(): void {
    console.log('Registered Bank Adapters:');
    this.adapters.forEach((adapter, bankName) => {
      console.log(`- ${bankName}: ${adapter.isSupported ? 'Supported' : 'Not Supported'}`);
    });
  }
}

// Export singleton instance
export const bankRegistry = BankRegistry.getInstance();