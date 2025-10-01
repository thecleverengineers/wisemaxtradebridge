import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  DollarSign, 
  Settings, 
  BarChart3, 
  Trophy,
  TrendingUp,
  Wallet,
  Target,
  Globe,
  Gift,
  Award,
  ChevronLeft
} from 'lucide-react';
import ForexManagement from '@/components/admin/ForexManagement';
import USDTStakingManagement from '@/components/admin/USDTStakingManagement';
import BinaryManagement from '@/components/admin/BinaryManagement';
import ROIManagement from '@/components/admin/ROIManagement';
import UserManagement from '@/components/admin/UserManagement';
import DepositManagement from '@/components/admin/DepositManagement';
import WithdrawManagement from '@/components/admin/WithdrawManagement';
import ReferralManagement from '@/components/admin/ReferralManagement';
import BinaryControl from '@/components/admin/BinaryControl';
import WebsiteSettings from '@/components/admin/WebsiteSettings';
import RewardsManagement from '@/components/admin/RewardsManagement';
import LevelSystemManagement from '@/components/admin/LevelSystemManagement';
import LeaderboardManagement from '@/components/admin/LeaderboardManagement';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
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

  const managementSections = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'forex', label: 'Manage Forex', icon: TrendingUp },
    { id: 'staking', label: 'USDT Staking', icon: Wallet },
    { id: 'binary', label: 'Binary Options', icon: Target },
    { id: 'roi', label: 'ROI Investments', icon: DollarSign },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'deposits', label: 'Deposits', icon: DollarSign },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'binary-control', label: 'Binary Control', icon: Settings },
    { id: 'website', label: 'Website Settings', icon: Globe },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'levels', label: 'Level System', icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 h-auto">
            {managementSections.slice(0, 7).map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="flex flex-col gap-1 h-auto py-2"
              >
                <section.icon className="h-4 w-4" />
                <span className="text-xs">{section.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 h-auto mt-2">
            {managementSections.slice(7).map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="flex flex-col gap-1 h-auto py-2"
              >
                <section.icon className="h-4 w-4" />
                <span className="text-xs">{section.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="forex" className="mt-6">
            <ForexManagement />
          </TabsContent>

          <TabsContent value="staking" className="mt-6">
            <USDTStakingManagement />
          </TabsContent>

          <TabsContent value="binary" className="mt-6">
            <BinaryManagement />
          </TabsContent>

          <TabsContent value="roi" className="mt-6">
            <ROIManagement />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="deposits" className="mt-6">
            <DepositManagement />
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-6">
            <WithdrawManagement />
          </TabsContent>

          <TabsContent value="referrals" className="mt-6">
            <ReferralManagement />
          </TabsContent>

          <TabsContent value="binary-control" className="mt-6">
            <BinaryControl />
          </TabsContent>

          <TabsContent value="website" className="mt-6">
            <WebsiteSettings />
          </TabsContent>

          <TabsContent value="rewards" className="mt-6">
            <RewardsManagement />
          </TabsContent>

          <TabsContent value="levels" className="mt-6">
            <LevelSystemManagement />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const AdminOverview = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
          <CardDescription>Active platform users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">1,234</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Deposits</CardTitle>
          <CardDescription>Lifetime deposits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">$123,456</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Investments</CardTitle>
          <CardDescription>Current active investments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">567</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
          <CardDescription>Awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">23</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;