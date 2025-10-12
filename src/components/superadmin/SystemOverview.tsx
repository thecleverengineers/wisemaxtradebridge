import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, Activity, Wallet, Award, BarChart, PieChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalInvestment: number;
  totalROI: number;
  totalReferralEarnings: number;
  totalWalletBalance: number;
  verifiedKYC: number;
  pendingKYC: number;
  totalTransactions: number;
  todayTransactions: number;
}

const SystemOverview = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalInvestment: 0,
    totalROI: 0,
    totalReferralEarnings: 0,
    totalWalletBalance: 0,
    verifiedKYC: 0,
    pendingKYC: 0,
    totalTransactions: 0,
    todayTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch wallet balances
      const { data: wallets } = await supabase
        .from('wallets')
        .select('balance, roi_income, referral_income')
        .eq('currency', 'USDT');

      // Fetch transaction statistics
      const { data: transactions } = await supabase
        .from('transactions')
        .select('created_at');

      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = transactions?.filter(t => 
        t.created_at.startsWith(today)
      ).length || 0;

      // Fetch investment stats
      const { data: investmentsData } = await supabase
        .from('investments')
        .select('amount');

      // Calculate statistics
      const totalUsers = usersCount || 0;
      const activeUsers = totalUsers; // All users are considered active
      const verifiedKYC = 0; // KYC not tracked in profiles
      const pendingKYC = 0;
      
      const totalInvestment = investmentsData?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0) || 0;
      const totalROI = wallets?.reduce((sum, w) => sum + (w.roi_income || 0), 0) || 0;
      const totalReferralEarnings = wallets?.reduce((sum, w) => sum + (w.referral_income || 0), 0) || 0;
      
      const totalWalletBalance = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0;

      setStats({
        totalUsers,
        activeUsers,
        totalInvestment,
        totalROI,
        totalReferralEarnings,
        totalWalletBalance,
        verifiedKYC,
        pendingKYC,
        totalTransactions: transactions?.length || 0,
        todayTransactions,
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: `${stats.activeUsers} active users`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Investment',
      value: formatCurrency(stats.totalInvestment),
      description: 'Across all users',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total ROI Earned',
      value: formatCurrency(stats.totalROI),
      description: 'Total returns generated',
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Referral Earnings',
      value: formatCurrency(stats.totalReferralEarnings),
      description: 'Total referral commissions',
      icon: Award,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Total Wallet Balance',
      value: formatCurrency(stats.totalWalletBalance),
      description: 'Combined USDT balance',
      icon: Wallet,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'KYC Status',
      value: `${stats.verifiedKYC}/${stats.totalUsers}`,
      description: `${stats.pendingKYC} pending verification`,
      icon: Activity,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions,
      description: `${stats.todayTransactions} today`,
      icon: BarChart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Platform Health',
      value: `${Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100)}%`,
      description: 'User activity rate',
      icon: PieChart,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`${stat.bgColor} p-2 rounded-lg`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SystemOverview;