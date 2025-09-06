
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
  totalTrades: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  pendingApprovals: number;
  newSignups: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setStats({
        totalUsers: 15420,
        activeUsers: 8750,
        totalRevenue: 2450000,
        monthlyGrowth: 12.5,
        totalTrades: 85600,
        systemHealth: 'excellent',
        pendingApprovals: 25,
        newSignups: 127
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={`${
            stats?.systemHealth === 'excellent' ? 'bg-green-100 text-green-700' :
            stats?.systemHealth === 'good' ? 'bg-blue-100 text-blue-700' :
            stats?.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {stats?.systemHealth === 'excellent' && <CheckCircle className="h-4 w-4 mr-1" />}
            {stats?.systemHealth === 'warning' && <AlertTriangle className="h-4 w-4 mr-1" />}
            System {stats?.systemHealth}
          </Badge>
          <Button>
            <Eye className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalUsers.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{stats?.newSignups} today</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  ${(stats?.totalRevenue! / 1000000).toFixed(1)}M
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{stats?.monthlyGrowth}% this month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Active Users</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats?.activeUsers.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <Activity className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">
                    {((stats?.activeUsers! / stats?.totalUsers!) * 100).toFixed(1)}% active
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Trades</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalTrades.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600">{stats?.pendingApprovals} pending</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Process Withdrawals
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              System Monitor
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New user registration</p>
                <p className="text-xs text-slate-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Withdrawal processed</p>
                <p className="text-xs text-slate-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">System backup completed</p>
                <p className="text-xs text-slate-500">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New investment plan created</p>
                <p className="text-xs text-slate-500">3 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
