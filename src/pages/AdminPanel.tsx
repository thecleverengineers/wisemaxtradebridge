
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { SystemMonitor } from '@/components/admin/SystemMonitor';
import { DynamicFeatureManager } from '@/components/admin/DynamicFeatureManager';
import { UserManagement } from '@/components/admin/UserManagement';
import { InvestmentManagement } from '@/components/admin/InvestmentManagement';
import { WithdrawalManagement } from '@/components/admin/WithdrawalManagement';
import { SettingsManagement } from '@/components/admin/SettingsManagement';

const AdminPanel = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You don't have permission to access the admin panel. Please contact your administrator.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="analytics" element={<div>Analytics Coming Soon</div>} />
        <Route path="transactions" element={<div>Transactions Coming Soon</div>} />
        <Route path="investments" element={<InvestmentManagement />} />
        <Route path="trading" element={<div>Trading Management Coming Soon</div>} />
        <Route path="notifications" element={<div>Notifications Coming Soon</div>} />
        <Route path="reports" element={<div>Reports Coming Soon</div>} />
        <Route path="monitor" element={<SystemMonitor />} />
        <Route path="database" element={<div>Database Management Coming Soon</div>} />
        <Route path="features" element={<DynamicFeatureManager />} />
        <Route path="withdrawals" element={<WithdrawalManagement />} />
        <Route path="settings" element={<SettingsManagement />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminPanel;
