import React from 'react';

const AccountsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
        <button className="btn-primary">
          Link New Account
        </button>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">🏦</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts linked yet</h3>
          <p className="text-gray-600 mb-6">
            Connect your Canadian bank accounts to start tracking your finances
          </p>
          <button className="btn-primary">
            Link Your First Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountsPage;