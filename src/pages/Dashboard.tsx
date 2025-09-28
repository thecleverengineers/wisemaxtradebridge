import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Wallet, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  ChartBar,
  Coins
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface WalletData {
  id: string;
  currency: string;
  balance: number;
  roi_income: number;
  referral_income: number;
  level_income: number;
  bonus_income: number;
  locked_balance: number;
}

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  notes?: string;
}

interface ROIInvestment {
  id: string;
  plan_name: string;
  amount: number;
  daily_return: number;
  total_return: number;
  status: string;
  started_at: string;
  expires_at: string;
  total_paid_out: number;
}

interface Analytics {
  total_trades: number;
  successful_trades: number;
  total_volume: number;
  profit_loss: number;
  win_rate: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change_percent: number;
  volume: number;
}

export function Dashboard() {
  const { user, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [roiInvestments, setRoiInvestments] = useState<ROIInvestment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  // Calculate total balance across all wallets
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const totalROI = wallets.reduce((sum, wallet) => sum + wallet.roi_income, 0);
  const totalReferral = wallets.reduce((sum, wallet) => sum + wallet.referral_income, 0);
  const activeInvestments = roiInvestments.filter(inv => inv.status === 'active').length;

  // Fetch initial data
  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
    setupRealtimeSubscriptions();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id);

      if (walletsError) throw walletsError;
      setWallets(walletsData || []);

      // Fetch recent transactions
      const { data: transactionsData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transError) throw transError;
      setTransactions(transactionsData || []);

      // Fetch ROI investments
      const { data: roiData, error: roiError } = await supabase
        .from('roi_investments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (roiError) throw roiError;
      setRoiInvestments(roiData || []);

      // Fetch analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData);

      // Fetch market data
      const { data: marketDataRes, error: marketError } = await supabase
        .from('market_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      if (marketError) throw marketError;
      setMarketData(marketDataRes || []);

      // Fetch referral count
      const { count, error: refError } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user?.id);

      if (refError) throw refError;
      setReferralCount(count || 0);

      // Prepare chart data
      prepareChartData(transactionsData || []);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (transactions: Transaction[]) => {
    // Group transactions by date for chart
    const grouped = transactions.reduce((acc: any, trans) => {
      const date = new Date(trans.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (trans.type === 'deposit' || trans.type === 'roi') {
        acc[date].income += trans.amount;
      } else {
        acc[date].expense += trans.amount;
      }
      return acc;
    }, {});

    setChartData(Object.values(grouped).slice(0, 7).reverse());
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to wallet changes
    const walletChannel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Wallet update:', payload);
          fetchDashboardData();
        }
      )
      .subscribe();

    // Subscribe to new transactions
    const transactionChannel = supabase
      .channel('transaction-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('New transaction:', payload);
          setTransactions(prev => [payload.new as Transaction, ...prev.slice(0, 9)]);
          toast({
            title: "New Transaction",
            description: `${payload.new.type} of ${payload.new.amount} ${payload.new.currency}`,
          });
        }
      )
      .subscribe();

    // Subscribe to market data updates
    const marketChannel = supabase
      .channel('market-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_data'
        },
        (payload) => {
          console.log('Market update:', payload);
          setMarketData(prev => [payload.new as MarketData, ...prev.slice(0, 4)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(transactionChannel);
      supabase.removeChannel(marketChannel);
    };
  };

  const pieChartData = [
    { name: 'Balance', value: totalBalance, color: '#a78bfa' },
    { name: 'ROI Income', value: totalROI, color: '#10b981' },
    { name: 'Referral Income', value: totalReferral, color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-sm">LT</span>
          </div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-purple-300">Welcome back, {profile?.name || 'User'}</p>
            </div>
            <Badge className={profile?.kyc_status === 'verified' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
              KYC: {profile?.kyc_status || 'Pending'}
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-300">Total Balance</CardTitle>
                <Wallet className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${totalBalance.toFixed(2)}</div>
                <p className="text-xs text-purple-300">
                  {totalBalance > 0 ? (
                    <span className="text-green-400 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span>Start investing</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-300">ROI Income</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${totalROI.toFixed(2)}</div>
                <p className="text-xs text-purple-300">
                  {activeInvestments} active investments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-300">Referral Income</CardTitle>
                <Users className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${totalReferral.toFixed(2)}</div>
                <p className="text-xs text-purple-300">
                  {referralCount} referrals
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-300">Win Rate</CardTitle>
                <Activity className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {analytics?.win_rate ? `${analytics.win_rate.toFixed(1)}%` : '0%'}
                </div>
                <p className="text-xs text-purple-300">
                  {analytics?.total_trades || 0} total trades
                </p>
              </CardContent>
            </Card>
          </div>

      {/* Charts and Data */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Income Chart */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Income Overview</CardTitle>
                <CardDescription className="text-purple-300">Your income over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height="300">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#a78bfa" />
                    <YAxis stroke="#a78bfa" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20' }} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Portfolio Distribution */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Portfolio Distribution</CardTitle>
                <CardDescription className="text-purple-300">Breakdown of your income sources</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height="300">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Balances */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Wallet Balances</CardTitle>
              <CardDescription className="text-purple-300">Your cryptocurrency holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wallets.map((wallet) => (
                  <div key={wallet.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-4">
                      <Coins className="h-8 w-8 text-purple-400" />
                      <div>
                        <p className="font-medium text-white">{wallet.currency}</p>
                        <p className="text-sm text-purple-300">Available Balance</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{wallet.balance.toFixed(4)}</p>
                      {wallet.locked_balance > 0 && (
                        <p className="text-sm text-purple-300">
                          Locked: {wallet.locked_balance.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent Transactions</CardTitle>
              <CardDescription className="text-purple-300">Your latest financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-white/10">
                      <div className="flex items-center space-x-4">
                        {transaction.type === 'deposit' ? (
                          <ArrowDownRight className="h-5 w-5 text-green-400" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-400" />
                        )}
                        <div>
                          <p className="font-medium capitalize text-white">{transaction.type}</p>
                          <p className="text-sm text-purple-300">
                            {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">
                          {transaction.type === 'deposit' ? '+' : '-'}
                          {transaction.amount.toFixed(2)} {transaction.currency}
                        </p>
                        <Badge className={
                          transaction.status === 'completed' ? 'bg-green-500 text-white' : 
                          transaction.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                        }>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Active ROI Investments</CardTitle>
              <CardDescription className="text-purple-300">Your current investment portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roiInvestments.filter(inv => inv.status === 'active').map((investment) => (
                  <div key={investment.id} className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{investment.plan_name}</h4>
                        <p className="text-sm text-purple-300">
                          Started {formatDistanceToNow(new Date(investment.started_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-purple-300">Invested</p>
                        <p className="font-bold text-white">${investment.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-purple-300">Daily Return</p>
                        <p className="font-bold text-white">{investment.daily_return}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-purple-300">Total Paid Out</p>
                        <p className="font-bold text-green-400">${investment.total_paid_out.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-purple-300">Expires</p>
                        <p className="font-bold text-white">
                          {formatDistanceToNow(new Date(investment.expires_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full h-2 transition-all"
                          style={{ 
                            width: `${Math.min(100, (investment.total_paid_out / investment.total_return) * 100)}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-purple-300 mt-1">
                        {((investment.total_paid_out / investment.total_return) * 100).toFixed(1)}% completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Live Market Data</CardTitle>
              <CardDescription className="text-purple-300">Real-time cryptocurrency prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData.map((market) => (
                  <div key={market.symbol} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-4">
                      <ChartBar className="h-8 w-8 text-purple-400" />
                      <div>
                        <p className="font-medium text-white">{market.symbol}</p>
                        <p className="text-sm text-purple-300">Volume: {market.volume.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">${market.price.toFixed(2)}</p>
                      <p className={`text-sm flex items-center justify-end ${
                        market.change_percent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {market.change_percent >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(market.change_percent).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>

  <BottomNavigation />
</div>
);
}