import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminStats } from '@/hooks/useAdminStats';
import {
  Users,
  DollarSign,
  TrendingUp,
  Wallet,
  Activity,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const AdminOverview = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      description: `${stats?.activeUsers || 0} active`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      progress: ((stats?.activeUsers || 0) / (stats?.totalUsers || 1)) * 100,
    },
    {
      title: 'Total Deposits',
      value: `$${(stats?.totalDeposits || 0).toLocaleString()}`,
      description: `${stats?.pendingDeposits || 0} pending`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Active Investments',
      value: stats?.activeInvestments || 0,
      description: `$${(stats?.totalInvestmentValue || 0).toLocaleString()} total value`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Wallet Balance',
      value: `$${(stats?.totalWalletBalance || 0).toLocaleString()}`,
      description: 'Total USDT balance',
      icon: Wallet,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Active Trades',
      value: stats?.activeTrades || 0,
      description: 'Binary options pending',
      icon: Activity,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Total Referrals',
      value: stats?.totalReferrals || 0,
      description: 'Active referral connections',
      icon: UserPlus,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Withdrawals',
      value: `$${(stats?.totalWithdrawals || 0).toLocaleString()}`,
      description: `${stats?.pendingWithdrawals || 0} pending`,
      icon: ArrowUpRight,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Total Transactions',
      value: stats?.totalTransactions || 0,
      description: 'All-time transactions',
      icon: ArrowDownRight,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              {stat.progress && (
                <Progress value={stat.progress} className="mt-2 h-1" />
              )}
              {stat.trend && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.trend}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
              <DollarSign className="h-5 w-5 mb-2 text-primary" />
              <div className="font-medium">Process Deposits</div>
              <div className="text-xs text-muted-foreground">Review pending deposits</div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
              <Wallet className="h-5 w-5 mb-2 text-primary" />
              <div className="font-medium">Handle Withdrawals</div>
              <div className="text-xs text-muted-foreground">Approve withdrawals</div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
              <Users className="h-5 w-5 mb-2 text-primary" />
              <div className="font-medium">Manage Users</div>
              <div className="text-xs text-muted-foreground">User administration</div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
              <Activity className="h-5 w-5 mb-2 text-primary" />
              <div className="font-medium">Trading Control</div>
              <div className="text-xs text-muted-foreground">Binary options control</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-2 border-b">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <UserPlus className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">New user registered</div>
                <div className="text-xs text-muted-foreground">user@example.com joined</div>
              </div>
              <div className="text-xs text-muted-foreground">2 mins ago</div>
            </div>
            <div className="flex items-center gap-4 pb-2 border-b">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Deposit received</div>
                <div className="text-xs text-muted-foreground">$500 USDT deposited</div>
              </div>
              <div className="text-xs text-muted-foreground">5 mins ago</div>
            </div>
            <div className="flex items-center gap-4 pb-2 border-b">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">ROI Investment started</div>
                <div className="text-xs text-muted-foreground">$1,000 in Gold plan</div>
              </div>
              <div className="text-xs text-muted-foreground">10 mins ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;