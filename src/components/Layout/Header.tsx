import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Canadian Finance Tracker
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Personal Finance Tracker
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;