import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <DashboardContent />
        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;