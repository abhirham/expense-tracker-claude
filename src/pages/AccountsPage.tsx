import React, { useState, useEffect, useCallback } from 'react';
import { Account } from '../types';
import { apiClient } from '../services/api/client';
import BankConnectionModal from '../components/Banking/BankConnectionModal';
import BankCredentialsModal from '../components/Banking/BankCredentialsModal';
import AccountSelectionModal from '../components/Banking/AccountSelectionModal';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  PlusIcon,
  BanknotesIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionModal, setConnectionModal] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState(false);
  const [selectionModal, setSelectionModal] = useState(false);
  const [discoveredAccounts, setDiscoveredAccounts] = useState<Account[]>([]);
  const [selectedBankName, setSelectedBankName] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      // Load accounts from localStorage (temporary solution)
      const savedAccounts = JSON.parse(localStorage.getItem('userAccounts') || '[]');
      setAccounts(savedAccounts);
      setError('');
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleBankSelection = (bankName: string) => {
    setSelectedBankName(bankName);
    setConnectionModal(false);
    setCredentialsModal(true);
  };

  const handleCredentialsSubmit = async (credentials: { username: string; password: string }) => {
    setConnecting(true);
    setError('');

    try {
      console.log(`Connecting to ${selectedBankName} with credentials...`);

      // Call the backend API to connect to the bank
      const bankAccounts = await apiClient.connectToBank(selectedBankName, credentials);

      console.log(`Found ${bankAccounts.length} accounts for ${selectedBankName}`);
      setDiscoveredAccounts(bankAccounts);
      setCredentialsModal(false);
      setSelectionModal(true);

    } catch (error) {
      console.error('Bank connection failed:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleAccountSelection = async (selectedAccounts: Account[]) => {
    try {
      setConnecting(true);
      // TODO: Replace with API call to backend
      const existingAccounts = JSON.parse(localStorage.getItem('userAccounts') || '[]');
      const updatedAccounts = [...existingAccounts, ...selectedAccounts];
      localStorage.setItem('userAccounts', JSON.stringify(updatedAccounts));
      setAccounts(updatedAccounts);
      setSelectionModal(false);
      setDiscoveredAccounts([]);
      setSelectedBankName('');
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save accounts');
    } finally {
      setConnecting(false);
    }
  };

  const toggleAccountStatus = async (accountId: string, currentStatus: boolean) => {
    try {
      // TODO: Replace with API call to backend
      const existingAccounts = JSON.parse(localStorage.getItem('userAccounts') || '[]');
      const updatedAccounts = existingAccounts.map((acc: Account) =>
        acc.id === accountId ? { ...acc, isActive: !currentStatus } : acc
      );
      localStorage.setItem('userAccounts', JSON.stringify(updatedAccounts));
      setAccounts(updatedAccounts);
    } catch {
      setError('Failed to update account status');
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to unlink this account?')) return;

    try {
      // TODO: Replace with API call to backend
      const existingAccounts = JSON.parse(localStorage.getItem('userAccounts') || '[]');
      const updatedAccounts = existingAccounts.filter((acc: Account) => acc.id !== accountId);
      localStorage.setItem('userAccounts', JSON.stringify(updatedAccounts));
      setAccounts(updatedAccounts);
    } catch {
      setError('Failed to delete account');
    }
  };

  const formatBalance = (balance: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(balance);
  };

  const getAccountTypeIcon = (accountType: Account['accountType']): string => {
    const iconMap = {
      checking: '💳',
      savings: '💰',
      credit: '💸',
      investment: '📈',
      other: '🏦'
    };
    return iconMap[accountType] || '🏦';
  };

  const getAccountTypeLabel = (accountType: Account['accountType']): string => {
    const labelMap = {
      checking: 'Chequing',
      savings: 'Savings',
      credit: 'Credit Card',
      investment: 'Investment',
      other: 'Other'
    };
    return labelMap[accountType] || 'Account';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
        <button
          onClick={() => setConnectionModal(true)}
          className="btn-primary flex items-center space-x-2"
          disabled={connecting}
        >
          <PlusIcon className="h-5 w-5" />
          <span>Link New Account</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {connecting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <LoadingSpinner />
            <div className="text-blue-700">
              {selectedBankName ? `Connecting to ${selectedBankName}...` : 'Processing...'}
            </div>
          </div>
        </div>
      )}

      {accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getAccountTypeIcon(account.accountType)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {account.accountName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {account.bankName} • {getAccountTypeLabel(account.accountType)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleAccountStatus(account.id, account.isActive)}
                    className="text-gray-400 hover:text-gray-600"
                    title={account.isActive ? 'Deactivate account' : 'Activate account'}
                  >
                    {account.isActive ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteAccount(account.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Unlink account"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className={`text-xl font-bold ${
                  account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatBalance(account.balance)}
                </div>
                <div className="text-xs text-gray-500">
                  ****{account.accountNumber.slice(-4)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className={`px-2 py-1 rounded-full ${
                  account.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {account.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-gray-500">
                  Last sync: {account.lastSync.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BanknotesIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts linked yet</h3>
            <p className="text-gray-600 mb-6">
              Connect your Canadian bank accounts to start tracking your finances
            </p>
            <button
              onClick={() => setConnectionModal(true)}
              className="btn-primary"
              disabled={connecting}
            >
              Link Your First Account
            </button>
          </div>
        </div>
      )}

      <BankConnectionModal
        isOpen={connectionModal}
        onClose={() => setConnectionModal(false)}
        onSelectBank={handleBankSelection}
      />

      <BankCredentialsModal
        isOpen={credentialsModal}
        onClose={() => {
          setCredentialsModal(false);
          setSelectedBankName('');
        }}
        onSubmit={handleCredentialsSubmit}
        bankName={selectedBankName}
        isLoading={connecting}
      />

      <AccountSelectionModal
        isOpen={selectionModal}
        onClose={() => {
          setSelectionModal(false);
          setDiscoveredAccounts([]);
          setSelectedBankName('');
        }}
        onConfirm={handleAccountSelection}
        accounts={discoveredAccounts}
        bankName={selectedBankName}
        isLoading={connecting}
      />
    </div>
  );
};

export default AccountsPage;