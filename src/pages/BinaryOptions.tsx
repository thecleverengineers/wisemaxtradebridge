import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  AlertCircle,
  DollarSign,
  Users,
  Wallet,
  ChartBar,
  Target,
  Trophy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BinaryTradingInterface } from '@/components/binary/BinaryTradingInterface';
import { LiveTradingSignals } from '@/components/binary/LiveTradingSignals';
import { ActiveTrades } from '@/components/binary/ActiveTrades';
import { TradeHistory } from '@/components/binary/TradeHistory';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function BinaryOptions() {
  const { user, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [signals, setSignals] = useState<any[]>([]);
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [winRate, setWinRate] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', 'USDT')
      .single();

    if (!error && data) {
      setBalance(data.balance);
    }
  };

  // Fetch active signals
  const fetchSignals = async () => {
    const { data, error } = await supabase
      .from('binary_signals')
      .select('*')
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      setSignals(data);
    }
  };

  // Fetch active trades
  const fetchActiveTrades = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('binary_options_trades')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setActiveTrades(data);
    }
  };

  // Fetch trade history and calculate stats
  const fetchTradeHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('binary_options_trades')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['won', 'lost'])
      .order('settled_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTradeHistory(data);
      
      // Calculate statistics
      const wonTrades = data.filter(t => t.status === 'won').length;
      const lostTrades = data.filter(t => t.status === 'lost').length;
      const totalTradesCount = wonTrades + lostTrades;
      
      setTotalTrades(totalTradesCount);
      setWinRate(totalTradesCount > 0 ? (wonTrades / totalTradesCount) * 100 : 0);
      
      // Calculate total profit
      const profit = data.reduce((sum, trade) => {
        if (trade.status === 'won') {
          return sum + trade.profit_loss;
        } else {
          return sum + trade.profit_loss; // negative value for losses
        }
      }, 0);
      setTotalProfit(profit);
      
      // Prepare chart data
      prepareChartData(data);
    }
  };
  
  const prepareChartData = (trades: any[]) => {
    // Group trades by date for chart
    const grouped = trades.reduce((acc: any, trade) => {
      const date = new Date(trade.settled_at || trade.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, profit: 0, loss: 0 };
      }
      if (trade.status === 'won') {
        acc[date].profit += Math.max(0, trade.profit_loss);
      } else {
        acc[date].loss += Math.abs(trade.profit_loss);
      }
      return acc;
    }, {});

    setChartData(Object.values(grouped).slice(0, 7).reverse());
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchBalance();
    fetchSignals();
    fetchActiveTrades();
    fetchTradeHistory();
    setLoading(false);

    // Subscribe to wallet changes
    const walletChannel = supabase
      .channel('wallet-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchBalance();
      })
      .subscribe();

    // Subscribe to trade updates
    const tradesChannel = supabase
      .channel('trade-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'binary_options_trades',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchActiveTrades();
        fetchTradeHistory();
      })
      .subscribe();

    // Subscribe to new signals
    const signalsChannel = supabase
      .channel('signal-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'binary_signals'
      }, () => {
        fetchSignals();
      })
      .subscribe();

    // Auto-refresh signals every 10 seconds
    const signalInterval = setInterval(fetchSignals, 10000);

    return () => {
      walletChannel.unsubscribe();
      tradesChannel.unsubscribe();
      signalsChannel.unsubscribe();
      clearInterval(signalInterval);
    };
  }, [user]);

  const pieChartData = [
    { name: 'Won', value: totalTrades > 0 ? (winRate / 100) * totalTrades : 0, color: '#10b981' },
    { name: 'Lost', value: totalTrades > 0 ? ((100 - winRate) / 100) * totalTrades : 0, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-purple-400">Loading...</div>
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
              <h1 className="text-3xl font-bold text-white">Binary Options Trading</h1>
              <p className="text-purple-300">Welcome back, {profile?.name || 'Trader'}</p>
            </div>
            <Badge className="bg-purple-500 text-white">
              Live Trading
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-300">Available Balance</CardTitle>
                <Wallet className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${balance.toFixed(2)}</div>
                <p className="text-xs text-purple-300">
                  USDT Wallet
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-300">Total Profit/Loss</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", totalProfit >= 0 ? "text-green-400" : "text-red-400")}>
                  ${Math.abs(totalProfit).toFixed(2)}
                </div>
                <p className="text-xs text-purple-300 flex items-center">
                  {totalProfit >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-400" />
                  )}
                  {totalProfit >= 0 ? 'Profit' : 'Loss'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-300">Win Rate</CardTitle>
                <Trophy className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-purple-300">
                  {totalTrades} total trades
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-300">Active Trades</CardTitle>
                <Activity className="h-4 w-4 text-purple-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {activeTrades.length}
                </div>
                <p className="text-xs text-purple-300">
                  {signals.length} signals available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Trading */}
          <Tabs defaultValue="trading" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="active">Active Trades</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="trading" className="space-y-4">
              <BinaryTradingInterface balance={balance} onTradePlace={() => {
                fetchBalance();
                fetchActiveTrades();
                fetchTradeHistory();
              }} />
            </TabsContent>

            <TabsContent value="signals" className="space-y-4">
              <LiveTradingSignals />
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <ActiveTrades trades={activeTrades} />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <TradeHistory trades={tradeHistory} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Profit/Loss Chart */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Profit & Loss Overview</CardTitle>
                    <CardDescription className="text-purple-300">Your trading performance over the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height="300">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis dataKey="date" stroke="#a78bfa" />
                        <YAxis stroke="#a78bfa" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20' }} />
                        <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="loss" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Win/Loss Distribution */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Win/Loss Distribution</CardTitle>
                    <CardDescription className="text-purple-300">Breakdown of your trading results</CardDescription>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}