import React from 'react';

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <button className="btn-primary">
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
          <div className="text-center py-8 text-gray-500">
            <p>No data available</p>
            <p className="text-sm">Generate your first report to see monthly summaries</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
          <div className="text-center py-8 text-gray-500">
            <p>No data available</p>
            <p className="text-sm">Category breakdown will appear here</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Report Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Monthly Report</h4>
            <p className="text-sm text-gray-600 mb-4">
              Income, expenses, and net cash flow for a specific month
            </p>
            <button className="btn-secondary w-full">Generate</button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Category Analysis</h4>
            <p className="text-sm text-gray-600 mb-4">
              Spending breakdown by transaction categories
            </p>
            <button className="btn-secondary w-full">Generate</button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Account Summary</h4>
            <p className="text-sm text-gray-600 mb-4">
              Transaction summary for each linked bank account
            </p>
            <button className="btn-secondary w-full">Generate</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;