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
  user_id: string;
  investment_id: string;
  amount: number;
  type: string;
  description?: string;
  roi_date?: string;
  credited_at?: string;
  created_at: string;
}

interface Analytics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_profit: number;
  total_loss: number;
  net_profit: number;
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
  const activeInvestments = 0; // roiInvestments.filter(inv => inv.status === 'active').length;

  // Fetch initial data
  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
    setupRealtimeSubscriptions();
  }, [user]);

  const fetchDashboardData = async () => {
    try {

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
        .eq('user_id', user?.id);

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background"></div>
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {profile?.name || 'User'}</p>
            </div>
            <Badge variant={profile?.kyc_status === 'verified' ? 'default' : 'secondary'}>
              KYC: {profile?.kyc_status || 'Pending'}
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {totalBalance > 0 ? (
                    <span className="text-primary flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span>Start investing</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ROI Income</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalROI.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {activeInvestments} active investments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Referral Income</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalReferral.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {referralCount} referrals
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.win_rate ? `${analytics.win_rate.toFixed(1)}%` : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">
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
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Income Overview</CardTitle>
                <CardDescription>Your income over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height="300">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Portfolio Distribution */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Portfolio Distribution</CardTitle>
                <CardDescription>Breakdown of your income sources</CardDescription>
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
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Balances */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Wallet Balances</CardTitle>
              <CardDescription>Your cryptocurrency holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wallets.map((wallet) => (
                  <div key={wallet.id} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border border-border/50">
                    <div className="flex items-center space-x-4">
                      <Coins className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{wallet.currency}</p>
                        <p className="text-sm text-muted-foreground">Available Balance</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{wallet.balance.toFixed(4)}</p>
                      {wallet.locked_balance > 0 && (
                        <p className="text-sm text-muted-foreground">
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
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border border-border/50">
                      <div className="flex items-center space-x-4">
                        {transaction.type === 'deposit' ? (
                          <ArrowDownRight className="h-5 w-5 text-primary" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium capitalize">{transaction.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {transaction.type === 'deposit' ? '+' : '-'}
                          {transaction.amount.toFixed(2)} {transaction.currency}
                        </p>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' : 
                          transaction.status === 'pending' ? 'secondary' : 'destructive'
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
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Active Investments</CardTitle>
              <CardDescription>View your investments in the ROI Investments page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Visit the ROI Investments page to view and manage your investments</p>
                <Button onClick={() => window.location.href = '/roi-investments'}>
                  Go to Investments
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Live Market Data</CardTitle>
              <CardDescription>Real-time cryptocurrency prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData.map((market) => (
                  <div key={market.symbol} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border border-border/50">
                    <div className="flex items-center space-x-4">
                      <ChartBar className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{market.symbol}</p>
                        <p className="text-sm text-muted-foreground">Volume: {market.volume.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">${market.price.toFixed(2)}</p>
                      <p className={`text-sm flex items-center justify-end ${
                        market.change_percent >= 0 ? 'text-primary' : 'text-destructive'
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