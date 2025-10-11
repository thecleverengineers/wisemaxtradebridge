
import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/wisemax-logo.png';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center relative z-10">
          <div className="mb-8">
            <div className="mx-auto mb-6 flex justify-center">
              <img src={logo} alt="WiseMax Logo" className="w-32 h-32 object-contain" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to WiseMax</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Your premium trading platform for smart investments and financial growth
            </p>
          </div>
          
          <div className="space-y-4 w-full max-w-sm">
            <Button
              onClick={() => navigate('/auth')}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold py-3 text-lg shadow-lg"
            >
              Get Started
            </Button>
            <p className="text-muted-foreground text-sm">
              Join thousands of investors already earning with WiseMax
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background"></div>
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <DashboardContent />
      <BottomNavigation />
    </div>
  );
};

export default Index;
