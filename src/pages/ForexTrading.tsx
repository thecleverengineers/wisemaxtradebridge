import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChartBar,
  Globe,
  Zap,
  Target,
  Shield,
  BarChart3,
  LineChart,
  Eye,
  AlertCircle,
  RefreshCw,
  Wallet,
  Users
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MarketSession } from '@/components/forex/MarketSession';
import { NewsIntegration } from '@/components/forex/NewsIntegration';
import { CopyTrading } from '@/components/forex/CopyTrading';
import { AutomatedBots } from '@/components/forex/AutomatedBots';
import LiveTradingSignals from '@/components/forex/LiveTradingSignals';

interface ForexPair {
  id: string;
  symbol: string;
  base_currency: string;
  quote_currency: string;
  current_price: number;
  change_percent: number;
  change_amount: number;
  daily_high: number;
  daily_low: number;
  daily_volume: number;
  bid: number;
  ask: number;
  spread: number;
}

interface ForexPosition {
  id: string;
  pair_id: string;
  position_type: 'buy' | 'sell';
  entry_price: number;
  current_price: number;
  volume: number;
  margin_used: number;
  leverage: number;
  take_profit: number;
  stop_loss: number;
  profit_loss: number;
  profit_loss_percent: number;
  status: string;
  created_at: string;
  forex_pairs?: ForexPair;
}

interface ForexSignal {
  id: string;
  pair_id: string;
  signal_type: 'buy' | 'sell';
  entry_price: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  stop_loss: number;
  strength: string;
  risk_level: string;
  timeframe: string;
  analysis: string;
  accuracy_rate: number;
  is_active: boolean;
  created_at: string;
  forex_pairs?: ForexPair;
}

const ForexTrading = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [forexPairs, setForexPairs] = useState<ForexPair[]>([]);
  const [positions, setPositions] = useState<ForexPosition[]>([]);
  const [signals, setSignals] = useState<ForexSignal[]>([]);
  const [selectedPair, setSelectedPair] = useState<ForexPair | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalMargin, setTotalMargin] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [openPositions, setOpenPositions] = useState(0);
  
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [positionType, setPositionType] = useState<'buy' | 'sell'>('buy');
  const [volume, setVolume] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState('10');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  const [chartData, setChartData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const fetchData = async () => {
    await Promise.all([
      fetchForexPairs(),
      fetchPositions(),
      fetchSignals(),
      fetchWalletBalance(),
      fetchPerformanceData()
    ]);
  };

  const fetchForexPairs = async () => {
    try {
      const { data, error } = await supabase
        .from('forex_pairs')
        .select('*')
        .order('daily_volume', { ascending: false });

      if (error) throw error;
      setForexPairs(data || []);
      if (data && data.length > 0 && !selectedPair) {
        setSelectedPair(data[0]);
      }
    } catch (error) {
      console.error('Error fetching forex pairs:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('forex_positions')
        .select(`
          *,
          forex_pairs(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const positionsData = (data || []).map(p => ({
        ...p,
        position_type: p.position_type as 'buy' | 'sell'
      }));
      setPositions(positionsData);
      
      // Calculate totals
      const activePositions = positionsData.filter(p => p.status === 'open');
      setOpenPositions(activePositions.length);
      setTotalMargin(activePositions.reduce((sum, p) => sum + (p.margin_used || 0), 0));
      setTotalPnL(activePositions.reduce((sum, p) => sum + (p.profit_loss || 0), 0));
      
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('forex_signals')
        .select(`
          *,
          forex_pairs(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSignals((data || []).map(signal => ({
        ...signal,
        signal_type: signal.signal_type as 'buy' | 'sell'
      })));
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .eq('currency', 'USDT')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setWalletBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('forex_positions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      
      // Prepare performance chart data
      const grouped = (data || []).reduce((acc: any, pos) => {
        const date = new Date(pos.closed_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, profit: 0, loss: 0, count: 0 };
        }
        if (pos.profit_loss > 0) {
          acc[date].profit += pos.profit_loss;
        } else {
          acc[date].loss += Math.abs(pos.profit_loss);
        }
        acc[date].count += 1;
        return acc;
      }, {});

      setPerformanceData(Object.values(grouped).slice(0, 7).reverse());
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to forex pairs updates
    const pairsChannel = supabase
      .channel('forex-pairs-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forex_pairs'
        },
        (payload) => {
          setForexPairs(prev => 
            prev.map(pair => pair.id === payload.new.id ? payload.new as ForexPair : pair)
          );
        }
      )
      .subscribe();

    // Subscribe to positions changes
    const positionsChannel = supabase
      .channel('forex-positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forex_positions',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchPositions();
        }
      )
      .subscribe();

    // Subscribe to new signals
    const signalsChannel = supabase
      .channel('forex-signals-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forex_signals'
        },
        (payload) => {
          setSignals(prev => [payload.new as ForexSignal, ...prev.slice(0, 9)]);
          toast({
            title: "New Trading Signal",
            description: `${payload.new.signal_type.toUpperCase()} signal for ${payload.new.pair_id}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pairsChannel);
      supabase.removeChannel(positionsChannel);
      supabase.removeChannel(signalsChannel);
    };
  };

  const handlePlaceOrder = async () => {
    if (!selectedPair || !volume || !user) {
      toast({
        title: "Invalid Order",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const orderVolume = parseFloat(volume);
    const leverageValue = parseInt(leverage);
    const marginRequired = (orderVolume * selectedPair.current_price) / leverageValue;

    if (marginRequired > walletBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough margin for this position",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create position in forex_positions table
      const { error: positionError } = await supabase
        .from('forex_positions')
        .insert({
          user_id: user.id,
          pair_id: selectedPair.id,
          position_type: positionType,
          entry_price: selectedPair.current_price,
          current_price: selectedPair.current_price,
          volume: orderVolume,
          margin_used: marginRequired,
          leverage: leverageValue,
          take_profit: takeProfit ? parseFloat(takeProfit) : null,
          stop_loss: stopLoss ? parseFloat(stopLoss) : null,
          status: 'open'
        });

      if (positionError) throw positionError;

      // Create record in forex_records table
      const { error: recordError } = await supabase
        .from('forex_records')
        .insert({
          user_id: user.id,
          pair_symbol: selectedPair.symbol,
          order_type: orderType,
          position_type: positionType,
          volume: orderVolume,
          entry_price: selectedPair.current_price,
          current_price: selectedPair.current_price,
          leverage: leverageValue,
          margin_used: marginRequired,
          take_profit: takeProfit ? parseFloat(takeProfit) : null,
          stop_loss: stopLoss ? parseFloat(stopLoss) : null,
          status: 'open',
          notes: `${orderType.toUpperCase()} order placed via trading interface`
        });

      if (recordError) throw recordError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: walletBalance - marginRequired,
          locked_balance: marginRequired 
        })
        .eq('user_id', user.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'forex_trade',
          category: 'trading',
          currency: 'USDT',
          amount: marginRequired,
          status: 'completed',
          notes: `${positionType.toUpperCase()} ${orderVolume} ${selectedPair.symbol} @ ${selectedPair.current_price}`
        });

      if (txError) throw txError;

      toast({
        title: "Order Placed",
        description: `${positionType.toUpperCase()} position opened for ${selectedPair.symbol}`,
      });

      // Clear form
      setVolume('');
      setPrice('');
      setTakeProfit('');
      setStopLoss('');

      fetchData();
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClosePosition = async (positionId: string) => {
    try {
      const position = positions.find(p => p.id === positionId);
      if (!position) return;

      const { error: positionError } = await supabase
        .from('forex_positions')
        .update({
          status: 'closed',
          closed_price: position.current_price,
          closed_at: new Date().toISOString()
        })
        .eq('id', positionId);

      if (positionError) throw positionError;

      // Update forex_records table
      const { error: recordError } = await supabase
        .from('forex_records')
        .update({
          status: 'closed',
          closed_price: position.current_price,
          closed_at: new Date().toISOString(),
          close_reason: 'Manual close',
          profit_loss: position.profit_loss,
          profit_loss_percent: position.profit_loss_percent
        })
        .eq('user_id', user?.id)
        .eq('entry_price', position.entry_price)
        .eq('volume', position.volume)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);

      if (recordError) throw recordError;

      // Return margin to wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: walletBalance + position.margin_used + position.profit_loss,
          locked_balance: Math.max(0, totalMargin - position.margin_used) 
        })
        .eq('user_id', user?.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'forex_close',
          category: 'trading',
          currency: 'USDT',
          amount: position.margin_used + position.profit_loss,
          status: 'completed',
          notes: `Closed ${position.position_type} position for ${position.forex_pairs?.symbol || 'Forex pair'} with P&L: ${position.profit_loss > 0 ? '+' : ''}${position.profit_loss.toFixed(2)}`
        });

      if (txError) throw txError;

      toast({
        title: "Position Closed",
        description: `Position closed with ${position.profit_loss > 0 ? 'profit' : 'loss'} of $${Math.abs(position.profit_loss).toFixed(2)}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error closing position:', error);
      toast({
        title: "Error",
        description: "Failed to close position",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 overflow-x-hidden">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="px-2 sm:px-4 pt-14 sm:pt-16 pb-20 sm:pb-24 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex items-start sm:items-center justify-between gap-2 px-1">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white truncate leading-tight">Forex Trading</h1>
              <p className="text-[10px] sm:text-sm text-purple-300 truncate">Welcome, {profile?.name || 'Trader'}</p>
            </div>
            <Badge className={`flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0.5 ${profile?.kyc_status === 'verified' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
              KYC: {profile?.kyc_status || 'Pending'}
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-2 grid-cols-2 lg:grid-cols-4 w-full px-1">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
                <CardTitle className="text-[10px] sm:text-xs font-medium text-purple-300 leading-tight">Total Balance</CardTitle>
                <Wallet className="h-3 w-3 text-purple-300 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <div className="text-base sm:text-xl font-bold text-white leading-tight">${walletBalance.toFixed(2)}</div>
                <p className="text-[9px] sm:text-xs text-purple-300 mt-0.5">
                  {walletBalance > 0 ? (
                    <span className="text-green-400 flex items-center">
                      <TrendingUp className="h-2 w-2 mr-0.5" />
                      Active
                    </span>
                  ) : (
                    <span>Start trading</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
                <CardTitle className="text-[10px] sm:text-xs font-medium text-purple-300 leading-tight">Used Margin</CardTitle>
                <DollarSign className="h-3 w-3 text-purple-300 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <div className="text-base sm:text-xl font-bold text-white leading-tight">${totalMargin.toFixed(2)}</div>
                <p className="text-[9px] sm:text-xs text-purple-300 mt-0.5">
                  {openPositions} positions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
                <CardTitle className="text-[10px] sm:text-xs font-medium text-purple-300 leading-tight">Total P&L</CardTitle>
                <Users className="h-3 w-3 text-purple-300 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <div className={`text-base sm:text-xl font-bold leading-tight ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
                </div>
                <p className="text-[9px] sm:text-xs text-purple-300 mt-0.5">
                  Unrealized P/L
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
                <CardTitle className="text-[10px] sm:text-xs font-medium text-purple-300 leading-tight">Win Rate</CardTitle>
                <Activity className="h-3 w-3 text-purple-300 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <div className="text-base sm:text-xl font-bold text-white leading-tight">
                  {positions.filter(p => p.profit_loss > 0).length > 0 
                    ? `${((positions.filter(p => p.profit_loss > 0).length / positions.length) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <p className="text-[9px] sm:text-xs text-purple-300 mt-0.5">
                  {positions.length} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Signals Section */}
          <div className="space-y-2 w-full px-1">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-0.5 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full flex-shrink-0"></div>
              <h2 className="text-sm sm:text-base font-bold text-white">Live Trading Signals</h2>
            </div>
            <LiveTradingSignals />
          </div>

          {/* Overview Section */}
          <div className="space-y-2 w-full px-1">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-0.5 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full flex-shrink-0"></div>
              <h2 className="text-sm sm:text-base font-bold text-white">Market Overview</h2>
            </div>
            <div className="space-y-2 w-full">
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 w-full">
                {/* Performance Chart */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base text-white">Trading Performance</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-purple-300">Your P&L over the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={performanceData}>
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

                {/* Market Sessions */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base text-white">Market Sessions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-purple-300">Global trading sessions status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MarketSession />
                  </CardContent>
                </Card>
              </div>

              {/* Currency Pairs */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base text-white">Popular Currency Pairs</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-purple-300">Top traded forex pairs</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
                      {forexPairs.slice(0, 5).map((pair) => (
                        <div key={pair.id} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-white/10">
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                            <div>
                              <p className="text-sm sm:text-base font-medium text-white">{pair.symbol}</p>
                              <p className="text-xs sm:text-sm text-purple-300">{pair.base_currency}/{pair.quote_currency}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base sm:text-2xl font-bold text-white">{pair.current_price.toFixed(5)}</p>
                            <p className={`text-xs sm:text-sm flex items-center justify-end ${
                              pair.change_percent >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {pair.change_percent >= 0 ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                              {Math.abs(pair.change_percent).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
            </div>
          </div>

          {/* Trading Section */}
          <div className="space-y-2 w-full px-1">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-0.5 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full flex-shrink-0"></div>
              <h2 className="text-sm sm:text-base font-bold text-white">Place Trade</h2>
            </div>
            <div className="space-y-2 w-full">
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-3 w-full">
                {/* Chart Section */}
                <div className="lg:col-span-2 space-y-3 sm:space-y-4 w-full">
                  {/* Currency Pairs */}
                  <Card className="bg-white/5 border-white/10 overflow-hidden">
                    <CardContent className="p-2 sm:p-4">
                      <ScrollArea className="w-full max-w-full">
                        <div className="flex space-x-2 pb-2 min-w-max">
                          {forexPairs.map((pair) => (
                            <Button
                              key={pair.id}
                              variant={selectedPair?.id === pair.id ? 'default' : 'outline'}
                              onClick={() => setSelectedPair(pair)}
                              size="sm"
                              className={`flex-shrink-0 ${
                                selectedPair?.id === pair.id 
                                  ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                                  : 'border-white/10'
                              }`}
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-xs sm:text-sm font-semibold">{pair.symbol}</span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-[10px] sm:text-xs">{pair.current_price.toFixed(5)}</span>
                                  <span className={`text-[10px] sm:text-xs flex items-center ${
                                    pair.change_percent >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {pair.change_percent >= 0 ? <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3" /> : <TrendingDown className="h-2 w-2 sm:h-3 sm:w-3" />}
                                    {Math.abs(pair.change_percent).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Trading Chart */}
                  {selectedPair && (
                    <Card className="bg-white/5 border-white/10">
                       <CardHeader className="pb-2 sm:pb-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm sm:text-base text-white flex items-center flex-wrap">
                              <Globe className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                              <span className="truncate">{selectedPair.symbol}</span>
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm text-purple-300 truncate">
                              {selectedPair.base_currency}/{selectedPair.quote_currency}
                            </CardDescription>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base sm:text-xl lg:text-2xl font-bold text-white whitespace-nowrap">{selectedPair.current_price.toFixed(5)}</p>
                            <p className={`text-xs sm:text-sm flex items-center justify-end whitespace-nowrap ${
                              selectedPair.change_percent >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {selectedPair.change_percent >= 0 ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                              <span className="hidden sm:inline">{selectedPair.change_amount.toFixed(5)} </span>
                              ({selectedPair.change_percent.toFixed(2)}%)
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        {/* Market Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2 sm:p-3 bg-white/5 rounded-lg">
                            <p className="text-purple-300 text-[10px] sm:text-xs">24h High</p>
                            <p className="text-white text-xs sm:text-sm font-semibold">{selectedPair.daily_high.toFixed(5)}</p>
                          </div>
                          <div className="p-2 sm:p-3 bg-white/5 rounded-lg">
                            <p className="text-purple-300 text-[10px] sm:text-xs">24h Low</p>
                            <p className="text-white text-xs sm:text-sm font-semibold">{selectedPair.daily_low.toFixed(5)}</p>
                          </div>
                          <div className="p-2 sm:p-3 bg-white/5 rounded-lg">
                            <p className="text-purple-300 text-[10px] sm:text-xs">Bid</p>
                            <p className="text-green-400 text-xs sm:text-sm font-semibold">{selectedPair.bid.toFixed(5)}</p>
                          </div>
                          <div className="p-2 sm:p-3 bg-white/5 rounded-lg">
                            <p className="text-purple-300 text-[10px] sm:text-xs">Ask</p>
                            <p className="text-red-400 text-xs sm:text-sm font-semibold">{selectedPair.ask.toFixed(5)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Order Form */}
                <div className="space-y-3 sm:space-y-4 w-full">

                  {/* Place Order */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-sm sm:text-base text-white">Place Order</CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-purple-300">
                        Create a new position
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3 pb-4">
                      {/* Order Type */}
                      <div>
                        <Label className="text-xs sm:text-sm text-purple-300">Order Type</Label>
                        <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs sm:text-sm h-8 sm:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="market">Market</SelectItem>
                            <SelectItem value="limit">Limit</SelectItem>
                            <SelectItem value="stop">Stop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Buy/Sell Toggle */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant={positionType === 'buy' ? 'default' : 'outline'}
                          onClick={() => setPositionType('buy')}
                          className={`text-xs sm:text-sm ${positionType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'border-white/10'}`}
                        >
                          Buy
                        </Button>
                        <Button
                          size="sm"
                          variant={positionType === 'sell' ? 'default' : 'outline'}
                          onClick={() => setPositionType('sell')}
                          className={`text-xs sm:text-sm ${positionType === 'sell' ? 'bg-red-600 hover:bg-red-700' : 'border-white/10'}`}
                        >
                          Sell
                        </Button>
                      </div>

                      {/* Volume */}
                      <div>
                        <Label className="text-xs sm:text-sm text-purple-300">Volume (Lots)</Label>
                        <Input
                          type="number"
                          placeholder="0.01"
                          value={volume}
                          onChange={(e) => setVolume(e.target.value)}
                          className="bg-white/5 border-white/10 text-white text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>

                      {/* Price (for limit/stop orders) */}
                      {orderType !== 'market' && (
                        <div>
                          <Label className="text-xs sm:text-sm text-purple-300">Price</Label>
                          <Input
                            type="number"
                            placeholder={selectedPair?.current_price.toFixed(5)}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="bg-white/5 border-white/10 text-white text-xs sm:text-sm h-8 sm:h-10"
                          />
                        </div>
                      )}

                      {/* Leverage */}
                      <div>
                        <Label className="text-xs sm:text-sm text-purple-300">Leverage</Label>
                        <Select value={leverage} onValueChange={setLeverage}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs sm:text-sm h-8 sm:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1:1</SelectItem>
                            <SelectItem value="10">1:10</SelectItem>
                            <SelectItem value="50">1:50</SelectItem>
                            <SelectItem value="100">1:100</SelectItem>
                            <SelectItem value="200">1:200</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Take Profit */}
                      <div>
                        <Label className="text-xs sm:text-sm text-purple-300">Take Profit (Optional)</Label>
                        <Input
                          type="number"
                          placeholder="0.00000"
                          value={takeProfit}
                          onChange={(e) => setTakeProfit(e.target.value)}
                          className="bg-white/5 border-white/10 text-white text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>

                      {/* Stop Loss */}
                      <div>
                        <Label className="text-xs sm:text-sm text-purple-300">Stop Loss (Optional)</Label>
                        <Input
                          type="number"
                          placeholder="0.00000"
                          value={stopLoss}
                          onChange={(e) => setStopLoss(e.target.value)}
                          className="bg-white/5 border-white/10 text-white text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>

                      {/* Margin Info */}
                      {volume && selectedPair && (
                        <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg border border-purple-500/20">
                          <p className="text-purple-300 text-xs sm:text-sm mb-1">Required Margin</p>
                          <p className="text-white text-sm sm:text-base font-semibold">
                            ${((parseFloat(volume) * selectedPair.current_price) / parseInt(leverage)).toFixed(2)}
                          </p>
                        </div>
                      )}

                      {/* Place Order Button */}
                      <Button
                        onClick={handlePlaceOrder}
                        size="sm"
                        className="w-full text-xs sm:text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Place Order
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Positions Section */}
          <div className="space-y-2 w-full px-1">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-0.5 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full flex-shrink-0"></div>
              <h2 className="text-sm sm:text-base font-bold text-white">Open Positions</h2>
            </div>
            <div className="space-y-2 w-full">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base text-white">Active Trades</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-purple-300">
                    {positions.filter(p => p.status === 'open').length} open position(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <ScrollArea className="h-[250px] sm:h-[350px]">
                    <div className="space-y-2 sm:space-y-3 pb-2">
                      {positions.filter(p => p.status === 'open').length === 0 ? (
                        <div className="text-center py-6 sm:py-8">
                          <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400 mx-auto mb-3 sm:mb-4" />
                          <p className="text-xs sm:text-sm text-purple-300">No open positions</p>
                        </div>
                      ) : (
                        positions.filter(p => p.status === 'open').map((position) => (
                          <div key={position.id} className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-white/10 gap-2">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              {position.position_type === 'buy' ? (
                                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium capitalize text-white truncate">
                                  {position.forex_pairs?.symbol || 'Unknown'} - {position.position_type}
                                </p>
                                <p className="text-[10px] sm:text-xs text-purple-300 truncate">
                                  {formatDistanceToNow(new Date(position.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm sm:text-base font-bold ${position.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {position.profit_loss >= 0 ? '+' : ''}{position.profit_loss.toFixed(2)}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClosePosition(position.id)}
                                className="border-white/10 mt-1 text-[10px] sm:text-xs h-6 sm:h-7 px-2"
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Copy Trading Section */}
          <div className="space-y-2 w-full px-1">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-0.5 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full flex-shrink-0"></div>
              <h2 className="text-sm sm:text-base font-bold text-white">Copy Trading</h2>
            </div>
            <CopyTrading />
          </div>

          {/* Auto Bots Section */}
          <div className="space-y-2 w-full px-1 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-0.5 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full flex-shrink-0"></div>
              <h2 className="text-sm sm:text-base font-bold text-white">Automated Trading Bots</h2>
            </div>
            <AutomatedBots />
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default ForexTrading;