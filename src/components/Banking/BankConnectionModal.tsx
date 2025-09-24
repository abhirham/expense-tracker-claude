import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { bankRegistry } from '../../services/banking/registry';
import { SupportedBank } from '../../types';

interface BankConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBank: (bankName: string) => void;
}

const BankConnectionModal: React.FC<BankConnectionModalProps> = ({
  isOpen,
  onClose,
  onSelectBank
}) => {
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [supportedBanks] = useState<SupportedBank[]>(() =>
    bankRegistry.getAllSupportedBankInfo()
  );

  const handleConnect = () => {
    if (selectedBank) {
      onSelectBank(selectedBank);
      setSelectedBank('');
    }
  };

  const getBankLogo = (bankName: string): string => {
    // Simple emoji mapping for Canadian banks
    const logoMap: { [key: string]: string } = {
      'TD Canada Trust': '🏛️',
      'Royal Bank of Canada': '👑',
      'Bank of Montreal': '🏦',
      'Scotia Bank': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'CIBC': '🔵',
    };
    return logoMap[bankName] || '🏪';
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Connect Your Bank
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Choose your Canadian bank to securely connect your accounts. We'll help you select which accounts to track.
          </p>

          <div className="space-y-3 mb-6">
            {supportedBanks.length > 0 ? (
              supportedBanks.map((bank) => (
                <div key={bank.bankName} className="relative">
                  <input
                    type="radio"
                    id={bank.bankName}
                    name="bank"
                    value={bank.bankName}
                    checked={selectedBank === bank.bankName}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={bank.bankName}
                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedBank === bank.bankName
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getBankLogo(bank.bankName)}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {bank.bankName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {bank.isActive ? 'Active' : 'In Development'}
                        </p>
                      </div>
                      {selectedBank === bank.bankName && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No banks available</p>
                <p className="text-sm text-gray-400 mt-2">
                  Bank adapters are currently being set up
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
              onClick={handleConnect}
              disabled={!selectedBank}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Connect Bank
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            🔒 Your banking credentials are never stored. We use secure session-based authentication.
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default BankConnectionModal;