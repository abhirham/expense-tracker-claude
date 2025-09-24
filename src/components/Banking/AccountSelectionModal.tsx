import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Account } from '../../types';

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedAccounts: Account[]) => void;
  accounts: Account[];
  bankName: string;
  isLoading?: boolean;
}

const AccountSelectionModal: React.FC<AccountSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  accounts,
  bankName,
  isLoading = false
}) => {
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Reset selection when accounts change
    setSelectedAccountIds(new Set());
  }, [accounts]);

  const toggleAccount = (accountId: string) => {
    const newSelection = new Set(selectedAccountIds);
    if (newSelection.has(accountId)) {
      newSelection.delete(accountId);
    } else {
      newSelection.add(accountId);
    }
    setSelectedAccountIds(newSelection);
  };

  const handleConfirm = () => {
    const selectedAccounts = accounts.filter(account =>
      selectedAccountIds.has(account.id)
    );
    onConfirm(selectedAccounts);
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

  const formatAccountNumber = (accountNumber: string): string => {
    if (accountNumber.includes('*')) {
      return accountNumber;
    }
    // If full number, mask it
    return `****${accountNumber.slice(-4)}`;
  };

  const formatBalance = (balance: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(balance);
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

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Select Accounts to Track
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              We found {accounts.length} account(s) at <strong>{bankName}</strong>.
              Select which accounts you'd like to track in your finance dashboard.
            </p>
          </div>

          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Discovering accounts...</span>
              </div>
            ) : accounts.length > 0 ? (
              accounts.map((account) => (
                <div key={account.id} className="relative">
                  <input
                    type="checkbox"
                    id={account.id}
                    checked={selectedAccountIds.has(account.id)}
                    onChange={() => toggleAccount(account.id)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={account.id}
                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedAccountIds.has(account.id)
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="text-2xl mt-1">
                          {getAccountTypeIcon(account.accountType)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {account.accountName}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <span>{getAccountTypeLabel(account.accountType)}</span>
                            <span>•</span>
                            <span>{formatAccountNumber(account.accountNumber)}</span>
                          </div>
                          <div className="mt-2">
                            <span className={`text-lg font-semibold ${
                              account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatBalance(account.balance)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedAccountIds.has(account.id) && (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <CheckIcon className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No accounts found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Please check your bank login or try again
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedAccountIds.size === 0 || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Track {selectedAccountIds.size} Account{selectedAccountIds.size !== 1 ? 's' : ''}
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            You can change which accounts to track anytime in your settings.
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AccountSelectionModal;