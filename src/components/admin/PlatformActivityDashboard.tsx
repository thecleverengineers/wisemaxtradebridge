import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminStats } from '@/hooks/useAdminStats';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  BarChart3,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Package,
  Target,
} from 'lucide-react';

const PlatformActivityDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-accent rounded-lg"></div>
        <div className="h-32 bg-accent rounded-lg"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const winRate = stats?.binaryMetrics.totalTrades 
    ? (stats.binaryMetrics.wonTrades / stats.binaryMetrics.totalTrades) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Platform Activity Overview
          </CardTitle>
          <CardDescription>Real-time aggregated platform metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Platform Volume</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  (stats?.binaryMetrics.totalVolume || 0) +
                  (stats?.forexMetrics.totalVolume || 0) +
                  (stats?.roiMetrics.totalInvested || 0) +
                  (stats?.stakingMetrics.totalStaked || 0)
                )}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Platform Profit</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(
                  (stats?.binaryMetrics.totalProfit || 0) +
                  (stats?.forexMetrics.totalPnL || 0) +
                  (stats?.roiMetrics.totalPaidOut || 0) +
                  (stats?.stakingMetrics.totalEarned || 0)
                )}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Active Positions</p>
              <p className="text-2xl font-bold">
                {(stats?.activeTrades || 0) +
                  (stats?.forexMetrics.openPositions || 0) +
                  (stats?.roiMetrics.activeInvestments || 0) +
                  (stats?.stakingMetrics.activeStakes || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Platform Health</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  Operational
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats?.activeUsers} Active Users
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature-wise Activity */}
      <Tabs defaultValue="binary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="binary">Binary Options</TabsTrigger>
          <TabsTrigger value="forex">Forex Trading</TabsTrigger>
          <TabsTrigger value="roi">ROI Investments</TabsTrigger>
          <TabsTrigger value="staking">USDT Staking</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="binary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Binary Options Activity
                </span>
                <Badge variant="outline">{stats?.binaryMetrics.totalTrades} Total Trades</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="text-sm font-bold text-green-500">{formatPercentage(winRate)}</span>
                  </div>
                  <Progress value={winRate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Won Trades</span>
                    <span className="text-sm font-bold">{stats?.binaryMetrics.wonTrades}</span>
                  </div>
                  <Progress 
                    value={(stats?.binaryMetrics.wonTrades || 0) / (stats?.binaryMetrics.totalTrades || 1) * 100} 
                    className="h-2 bg-green-100" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lost Trades</span>
                    <span className="text-sm font-bold">{stats?.binaryMetrics.lostTrades}</span>
                  </div>
                  <Progress 
                    value={(stats?.binaryMetrics.lostTrades || 0) / (stats?.binaryMetrics.totalTrades || 1) * 100} 
                    className="h-2 bg-red-100" 
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Volume</span>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.binaryMetrics.totalVolume || 0)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total P&L</span>
                    {(stats?.binaryMetrics.totalProfit || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${(stats?.binaryMetrics.totalProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(stats?.binaryMetrics.totalProfit || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forex" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Forex Trading Activity
                </span>
                <Badge variant="outline">{stats?.forexMetrics.totalPositions} Total Positions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Open Positions</span>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{stats?.forexMetrics.openPositions}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Closed Positions</span>
                    <Clock className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-2xl font-bold">{stats?.forexMetrics.closedPositions}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Margin</span>
                    <Wallet className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.forexMetrics.totalMargin || 0)}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Volume</span>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.forexMetrics.totalVolume || 0)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total P&L</span>
                    {(stats?.forexMetrics.totalPnL || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${(stats?.forexMetrics.totalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(stats?.forexMetrics.totalPnL || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  ROI Investments Activity
                </span>
                <Badge variant="outline">{stats?.roiMetrics.totalInvestments} Total Investments</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <Activity className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{stats?.roiMetrics.activeInvestments}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <Clock className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-2xl font-bold">{stats?.roiMetrics.completedInvestments}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">ROI Rate</span>
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold">
                    {stats?.roiMetrics.totalInvested 
                      ? formatPercentage((stats.roiMetrics.totalPaidOut / stats.roiMetrics.totalInvested) * 100)
                      : '0%'}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Invested</span>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.roiMetrics.totalInvested || 0)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Paid Out</span>
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(stats?.roiMetrics.totalPaidOut || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  USDT Staking Activity
                </span>
                <Badge variant="outline">{stats?.stakingMetrics.totalStakes} Total Stakes</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <Activity className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{stats?.stakingMetrics.activeStakes}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Flexible</span>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{stats?.stakingMetrics.flexibleStakes}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Locked</span>
                    <Package className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold">{stats?.stakingMetrics.lockedStakes}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">APY Rate</span>
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold">
                    {stats?.stakingMetrics.totalStaked 
                      ? formatPercentage((stats.stakingMetrics.totalEarned / stats.stakingMetrics.totalStaked) * 100 * 365)
                      : '0%'}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Staked</span>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.stakingMetrics.totalStaked || 0)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Earned</span>
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(stats?.stakingMetrics.totalEarned || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Transaction Activity
                </span>
                <Badge variant="outline">
                  {(stats?.depositMetrics.totalDeposits || 0) + (stats?.withdrawalMetrics.totalWithdrawals || 0)} Total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Deposits */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-green-500" />
                  Deposits
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold text-yellow-500">{stats?.depositMetrics.pendingDeposits}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-xl font-bold text-green-500">{stats?.depositMetrics.approvedDeposits}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-xl font-bold text-red-500">{stats?.depositMetrics.rejectedDeposits}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(stats?.depositMetrics.totalDepositAmount || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Withdrawals */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                  Withdrawals
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold text-yellow-500">{stats?.withdrawalMetrics.pendingWithdrawals}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold text-green-500">{stats?.withdrawalMetrics.completedWithdrawals}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-xl font-bold text-red-500">{stats?.withdrawalMetrics.rejectedWithdrawals}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(stats?.withdrawalMetrics.totalWithdrawalAmount || 0)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Transactions Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Platform Activity
          </CardTitle>
          <CardDescription>Latest transactions across all features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentTransactions?.map((transaction: any) => (
              <div key={transaction.id} className="flex items-center gap-4 pb-3 border-b last:border-0">
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'deposit' ? 'bg-green-500/10' :
                  transaction.type === 'withdrawal' ? 'bg-red-500/10' :
                  transaction.type === 'binary_trade' ? 'bg-blue-500/10' :
                  transaction.type === 'roi' ? 'bg-purple-500/10' :
                  'bg-gray-500/10'
                }`}>
                  {transaction.type === 'deposit' ? <ArrowDownRight className="h-4 w-4 text-green-500" /> :
                   transaction.type === 'withdrawal' ? <ArrowUpRight className="h-4 w-4 text-red-500" /> :
                   transaction.type === 'binary_trade' ? <Activity className="h-4 w-4 text-blue-500" /> :
                   transaction.type === 'roi' ? <TrendingUp className="h-4 w-4 text-purple-500" /> :
                   <DollarSign className="h-4 w-4 text-gray-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm capitalize">
                      {transaction.type?.replace('_', ' ')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {transaction.notes || 'No description'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(transaction.amount || 0)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformActivityDashboard;