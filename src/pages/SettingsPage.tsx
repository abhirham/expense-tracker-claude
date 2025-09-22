import React from 'react';
import { useAuth } from '../hooks/useAuth';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input-field"
                value={user?.displayName || ''}
                readOnly
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                value={user?.email || ''}
                readOnly
              />
            </div>
            <div>
              <label className="label">Account Created</label>
              <input
                type="text"
                className="input-field"
                value={user?.createdAt?.toLocaleDateString() || ''}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Security</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Data Encryption</p>
                <p className="text-sm text-gray-600">All sensitive data is encrypted</p>
              </div>
              <span className="text-green-600 text-sm font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Verified</p>
                <p className="text-sm text-gray-600">Email verification status</p>
              </div>
              <span className={`text-sm font-medium ${user?.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                {user?.emailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Banks</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No bank integrations available yet</p>
          <p className="text-sm">Bank adapters will be listed here once implemented</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Export Data</p>
              <p className="text-sm text-gray-600">Download all your financial data</p>
            </div>
            <button className="btn-secondary">Export</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
            </div>
            <button className="btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;