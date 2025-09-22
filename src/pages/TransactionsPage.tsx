import React from 'react';

const TransactionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <div className="flex space-x-2">
          <button className="btn-secondary">
            Export CSV
          </button>
          <button className="btn-primary">
            Sync Transactions
          </button>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-600 mb-6">
            Link a bank account and sync your transactions to see them here
          </p>
          <button className="btn-primary">
            Link Bank Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;