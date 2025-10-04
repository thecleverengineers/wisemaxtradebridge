import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ChevronLeft } from 'lucide-react';
import UserManagement from '@/components/superadmin/UserManagement';
import SystemOverview from '@/components/superadmin/SystemOverview';
import RoleManagement from '@/components/superadmin/RoleManagement';
import ActivityLog from '@/components/superadmin/ActivityLog';
import AppSettings from '@/components/superadmin/AppSettings';
import BinaryRecordsManagement from '@/components/superadmin/BinaryRecordsManagement';
import ForexRecordsManagement from '@/components/superadmin/ForexRecordsManagement';
import ROIInvestmentManagement from '@/components/superadmin/ROIInvestmentManagement';
import USDTStakingManagement from '@/components/superadmin/USDTStakingManagement';
import InvestmentPlansManagement from '@/components/superadmin/InvestmentPlansManagement';
import StakingPlansManagement from '@/components/superadmin/StakingPlansManagement';
import DepositManagement from '@/components/superadmin/DepositManagement';
import WithdrawManagement from '@/components/admin/WithdrawManagement';
import { AdminSidebar } from '@/components/superadmin/AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';

const SuperAdminPanel = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the super admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <SystemOverview />;
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'binary':
        return <BinaryRecordsManagement />;
      case 'forex':
        return <ForexRecordsManagement />;
      case 'roi':
        return <ROIInvestmentManagement />;
      case 'usdt':
        return <USDTStakingManagement />;
      case 'deposits':
        return <DepositManagement />;
      case 'withdrawals':
        return <WithdrawManagement />;
      case 'plans':
        return <InvestmentPlansManagement />;
      case 'staking-plans':
        return <StakingPlansManagement />;
      case 'activity':
        return <ActivityLog />;
      case 'settings':
        return <AppSettings />;
      default:
        return <SystemOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Super Admin Panel</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminPanel;