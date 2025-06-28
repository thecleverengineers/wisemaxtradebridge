
import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-lg">IX</span>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">IX</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to InvestX</h1>
            <p className="text-purple-300 text-lg max-w-md mx-auto">
              Your premium trading platform for smart investments and financial growth
            </p>
          </div>
          
          <div className="space-y-4 w-full max-w-sm">
            <Button
              onClick={() => navigate('/auth')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 text-lg"
            >
              Get Started
            </Button>
            <p className="text-purple-400 text-sm">
              Join thousands of investors already earning with InvestX
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-900">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <DashboardContent />
        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
};

export default Index;
