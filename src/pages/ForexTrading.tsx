import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle, Clock, Target, Shield, BarChart3, ChevronUp, ChevronDown, Info, Bot, Users, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import new components
import { TradingChart } from '@/components/forex/TradingChart';
import { OrderBook } from '@/components/forex/OrderBook';
import { MarketSession } from '@/components/forex/MarketSession';
import { NewsIntegration } from '@/components/forex/NewsIntegration';
import { CopyTrading } from '@/components/forex/CopyTrading';
import { AutomatedBots } from '@/components/forex/AutomatedBots';

interface ForexPair {
  id: string;
  symbol: string;
  base_currency: string;
  quote_currency: string;
  current_price: number;
  previous_close: number;
  change_amount: number;
  change_percent: number;
  bid: number;
  ask: number;
  spread: number;
  daily_high: number;
  daily_low: number;
  daily_volume: number;
  last_updated: string;
}

interface ForexSignal {
  id: string;
  pair_id: string;
  signal_type: 'buy' | 'sell' | 'hold';
  strength: 'strong' | 'moderate' | 'weak';
  entry_price: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  stop_loss: number;
  analysis: string;
  accuracy_rate: number;
  risk_level: 'low' | 'medium' | 'high';
  timeframe: string;
  is_active: boolean;
  created_at: string;
  pair?: ForexPair;
}

interface ForexPosition {
  id: string;
  user_id: string;
  pair_id: string;
  signal_id: string;
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
  swap_fee: number;
  commission: number;
  status: 'open' | 'closed' | 'pending';
  created_at: string;
  pair?: ForexPair;
}

export default function ForexTrading() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [forexPairs, setForexPairs] = useState<ForexPair[]>([]);
  const [signals, setSignals] = useState<ForexSignal[]>([]);
  const [positions, setPositions] = useState<ForexPosition[]>([]);
  const [selectedPair, setSelectedPair] = useState<ForexPair | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<ForexSignal | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Trading form state
  const [tradeAmount, setTradeAmount] = useState('100');
  const [leverage, setLeverage] = useState([10]);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
    setupRealtimeSubscriptions();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch forex pairs
      const { data: pairsData, error: pairsError } = await supabase
        .from('forex_pairs')
        .select('*')
        .order('symbol');

      if (pairsError) throw pairsError;
      setForexPairs(pairsData || []);

      // Fetch active signals with pair data
      const { data: signalsData, error: signalsError } = await supabase
        .from('forex_signals')
        .select('*, pair:forex_pairs(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (signalsError) throw signalsError;
      setSignals((signalsData || []) as ForexSignal[]);

      // Fetch user positions with pair data
      const { data: positionsData, error: positionsError } = await supabase
        .from('forex_positions')
        .select('*, pair:forex_pairs(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (positionsError) throw positionsError;
      setPositions((positionsData || []) as ForexPosition[]);

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user!.id)
        .eq('currency', 'USDT')
        .single();

      if (walletError && walletError.code !== 'PGRST116') throw walletError;
      setWalletBalance(walletData?.balance || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load trading data');
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to forex pairs updates
    const pairsChannel = supabase
      .channel('forex-pairs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forex_pairs'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setForexPairs(prev => prev.map(pair => 
              pair.id === payload.new.id ? payload.new as ForexPair : pair
            ));
            // Update positions with new price
            updatePositionsWithNewPrice(payload.new as ForexPair);
          }
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
        async (payload) => {
          // Fetch the signal with pair data
          const { data: newSignal } = await supabase
            .from('forex_signals')
            .select('*, pair:forex_pairs(*)')
            .eq('id', payload.new.id)
            .single();
          
          if (newSignal) {
            setSignals(prev => [newSignal as ForexSignal, ...prev]);
            toast.info('New trading signal available!');
          }
        }
      )
      .subscribe();

    // Subscribe to user's positions
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
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newPosition } = await supabase
              .from('forex_positions')
              .select('*, pair:forex_pairs(*)')
              .eq('id', payload.new.id)
              .single();
            
            if (newPosition) {
              setPositions(prev => [newPosition as ForexPosition, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setPositions(prev => prev.map(pos => 
              pos.id === payload.new.id ? { ...pos, ...payload.new } : pos
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pairsChannel);
      supabase.removeChannel(signalsChannel);
      supabase.removeChannel(positionsChannel);
    };
  };

  const updatePositionsWithNewPrice = async (pair: ForexPair) => {
    const openPositions = positions.filter(p => p.pair_id === pair.id && p.status === 'open');
    
    for (const position of openPositions) {
      await supabase
        .from('forex_positions')
        .update({ current_price: pair.current_price })
        .eq('id', position.id);
    }
  };

  const handleTrade = async (type: 'buy' | 'sell', pair?: ForexPair, signal?: ForexSignal) => {
    const tradePair = pair || selectedPair;
    if (!tradePair) {
      toast.error('Please select a currency pair');
      return;
    }

    const amount = parseFloat(tradeAmount);
    const marginRequired = amount * leverage[0];

    if (marginRequired > walletBalance) {
      toast.error('Insufficient balance for this trade');
      return;
    }

    try {
      // Create position
      const { data: newPosition, error: positionError } = await supabase
        .from('forex_positions')
        .insert({
          user_id: user!.id,
          pair_id: tradePair.id,
          signal_id: signal?.id || selectedSignal?.id,
          position_type: type,
          entry_price: tradePair.current_price,
          current_price: tradePair.current_price,
          volume: amount,
          margin_used: marginRequired,
          leverage: leverage[0],
          take_profit: takeProfit ? parseFloat(takeProfit) : (signal?.take_profit_1 || null),
          stop_loss: stopLoss ? parseFloat(stopLoss) : (signal?.stop_loss || null),
          status: 'open'
        })
        .select()
        .single();

      if (positionError) throw positionError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: walletBalance - marginRequired })
        .eq('user_id', user!.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: user!.id,
        type: 'forex_trade',
        category: 'trading',
        currency: 'USDT',
        amount: marginRequired,
        status: 'completed',
        reference_id: newPosition.id,
        notes: `${type.toUpperCase()} ${tradePair.symbol} - Leverage ${leverage[0]}x`
      });

      setWalletBalance(prev => prev - marginRequired);
      toast.success(`${type.toUpperCase()} position opened for ${tradePair.symbol}`);
      
      // Reset form
      setTradeAmount('100');
      setLeverage([10]);
      setStopLoss('');
      setTakeProfit('');

    } catch (error) {
      console.error('Error opening position:', error);
      toast.error('Failed to open position');
    }
  };

  const handleClosePosition = async (position: ForexPosition) => {
    try {
      // Calculate final P&L
      const finalPnL = position.profit_loss - position.commission - position.swap_fee;
      const returnAmount = position.margin_used + finalPnL;

      // Close position
      const { error: positionError } = await supabase
        .from('forex_positions')
        .update({ 
          status: 'closed',
          closed_price: position.current_price,
          closed_at: new Date().toISOString()
        })
        .eq('id', position.id);

      if (positionError) throw positionError;

      // Return funds to wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: walletBalance + returnAmount })
        .eq('user_id', user!.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: user!.id,
        type: 'forex_close',
        category: 'trading',
        currency: 'USDT',
        amount: returnAmount,
        status: 'completed',
        reference_id: position.id,
        notes: `Closed ${position.position_type.toUpperCase()} ${position.pair?.symbol} - P&L: ${finalPnL.toFixed(2)} USDT`
      });

      setWalletBalance(prev => prev + returnAmount);
      setPositions(prev => prev.map(p => 
        p.id === position.id ? { ...p, status: 'closed' } : p
      ));
      
      toast.success(`Position closed. P&L: ${finalPnL.toFixed(2)} USDT`);
    } catch (error) {
      console.error('Error closing position:', error);
      toast.error('Failed to close position');
    }
  };

  const getTotalPnL = () => {
    return positions
      .filter(p => p.status === 'open')
      .reduce((sum, p) => sum + p.profit_loss, 0);
  };

  const getOpenPositionsCount = () => {
    return positions.filter(p => p.status === 'open').length;
  };


  return (
    <div className="min-h-screen bg-background">
      <AppHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex">
        <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 md:ml-64 pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground">Forex Trading</h1>
              <p className="text-muted-foreground mt-2">Trade major currency pairs with real-time signals</p>
            </div>

            {/* Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-2xl font-bold">${walletBalance.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total P&L</p>
                      <p className={cn(
                        "text-2xl font-bold",
                        getTotalPnL() >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {getTotalPnL() >= 0 ? '+' : ''}{getTotalPnL().toFixed(2)}
                      </p>
                    </div>
                    {getTotalPnL() >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Open Positions</p>
                      <p className="text-2xl font-bold">{getOpenPositionsCount()}</p>
                    </div>
                    <Activity className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Signals</p>
                      <p className="text-2xl font-bold">{signals.length}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="market" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                <TabsTrigger value="market">Market</TabsTrigger>
                <TabsTrigger value="chart">Charts</TabsTrigger>
                <TabsTrigger value="signals">Signals</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
                <TabsTrigger value="bots">Bots</TabsTrigger>
                <TabsTrigger value="copy">Copy</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
              </TabsList>

              <TabsContent value="market" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Currency Pairs</CardTitle>
                        <CardDescription>Real-time forex market prices</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[500px]">
                          <div className="space-y-2">
                            {forexPairs.map((pair) => (
                              <div
                                key={pair.id}
                                className={cn(
                                  "p-4 rounded-lg border cursor-pointer transition-colors",
                                  selectedPair?.id === pair.id ? "border-primary bg-accent" : "hover:bg-accent/50"
                                )}
                                onClick={() => setSelectedPair(pair)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold">{pair.symbol}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Spread: {pair.spread} | Volume: {(pair.daily_volume / 1000000).toFixed(2)}M
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold">{pair.current_price.toFixed(4)}</p>
                                    <p className={cn(
                                      "text-sm flex items-center justify-end",
                                      pair.change_percent >= 0 ? "text-green-500" : "text-red-500"
                                    )}>
                                      {pair.change_percent >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      {Math.abs(pair.change_percent).toFixed(2)}%
                                    </p>
                                  </div>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                  <span>H: {pair.daily_high?.toFixed(4)}</span>
                                  <span>L: {pair.daily_low?.toFixed(4)}</span>
                                  <span>Bid: {pair.bid?.toFixed(4)}</span>
                                  <span>Ask: {pair.ask?.toFixed(4)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Trade</CardTitle>
                        <CardDescription>
                          {selectedPair ? selectedPair.symbol : 'Select a pair to trade'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Amount (USD)</Label>
                          <Input
                            type="number"
                            value={tradeAmount}
                            onChange={(e) => setTradeAmount(e.target.value)}
                            placeholder="100"
                          />
                        </div>

                        <div>
                          <Label>Leverage: {leverage[0]}x</Label>
                          <Slider
                            value={leverage}
                            onValueChange={setLeverage}
                            min={1}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Take Profit (Optional)</Label>
                          <Input
                            type="number"
                            value={takeProfit}
                            onChange={(e) => setTakeProfit(e.target.value)}
                            placeholder={selectedPair ? (selectedPair.current_price * 1.01).toFixed(4) : ''}
                          />
                        </div>

                        <div>
                          <Label>Stop Loss (Optional)</Label>
                          <Input
                            type="number"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(e.target.value)}
                            placeholder={selectedPair ? (selectedPair.current_price * 0.99).toFixed(4) : ''}
                          />
                        </div>

                        <div className="pt-2 space-y-2">
                          <div className="text-sm text-muted-foreground">
                            <p>Margin Required: ${(parseFloat(tradeAmount || '0') * leverage[0]).toFixed(2)}</p>
                            <p>Available Balance: ${walletBalance.toFixed(2)}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              className="w-full"
                              variant="default"
                              onClick={() => handleTrade('buy')}
                              disabled={!selectedPair || parseFloat(tradeAmount || '0') * leverage[0] > walletBalance}
                            >
                              Buy
                            </Button>
                            <Button
                              className="w-full"
                              variant="destructive"
                              onClick={() => handleTrade('sell')}
                              disabled={!selectedPair || parseFloat(tradeAmount || '0') * leverage[0] > walletBalance}
                            >
                              Sell
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Trading Signals</CardTitle>
                    <CardDescription>AI-powered trading signals with risk analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {signals.map((signal) => (
                          <Card key={signal.id} className="border-2">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{signal.pair?.symbol}</h3>
                                  <Badge variant={signal.signal_type === 'buy' ? 'default' : signal.signal_type === 'sell' ? 'destructive' : 'secondary'}>
                                    {signal.signal_type.toUpperCase()}
                                  </Badge>
                                  <Badge variant={signal.strength === 'strong' ? 'default' : signal.strength === 'moderate' ? 'secondary' : 'outline'}>
                                    {signal.strength}
                                  </Badge>
                                </div>
                                <Badge variant={signal.risk_level === 'low' ? 'default' : signal.risk_level === 'medium' ? 'secondary' : 'destructive'}>
                                  {signal.risk_level} risk
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Entry Price</p>
                                  <p className="font-semibold">{signal.entry_price.toFixed(4)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Stop Loss</p>
                                  <p className="font-semibold text-red-500">{signal.stop_loss?.toFixed(4) || '-'}</p>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Take Profit Targets</p>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-green-500">
                                    TP1: {signal.take_profit_1?.toFixed(4)}
                                  </Badge>
                                  <Badge variant="outline" className="text-green-500">
                                    TP2: {signal.take_profit_2?.toFixed(4)}
                                  </Badge>
                                  <Badge variant="outline" className="text-green-500">
                                    TP3: {signal.take_profit_3?.toFixed(4)}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  <Target className="h-4 w-4" />
                                  {signal.accuracy_rate?.toFixed(0)}% accuracy
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {signal.timeframe}
                                </span>
                              </div>

                              <p className="text-sm text-muted-foreground">{signal.analysis}</p>

                              <Button
                                className="w-full"
                                size="sm"
                                onClick={() => {
                                  setSelectedPair(signal.pair!);
                                  setSelectedSignal(signal);
                                  handleTrade(signal.signal_type as 'buy' | 'sell', signal.pair, signal);
                                }}
                              >
                                Trade This Signal
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="positions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Open Positions</CardTitle>
                    <CardDescription>Monitor and manage your active trades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4">
                        {positions.filter(p => p.status === 'open').map((position) => (
                          <Card key={position.id} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{position.pair?.symbol}</h4>
                                <Badge variant={position.position_type === 'buy' ? 'default' : 'destructive'}>
                                  {position.position_type.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">{position.leverage}x</Badge>
                              </div>
                              <div className={cn(
                                "text-right",
                                position.profit_loss >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                <p className="font-semibold">
                                  {position.profit_loss >= 0 ? '+' : ''}{position.profit_loss.toFixed(2)} USDT
                                </p>
                                <p className="text-sm">
                                  {position.profit_loss_percent >= 0 ? '+' : ''}{position.profit_loss_percent.toFixed(2)}%
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <p className="text-muted-foreground">Entry</p>
                                <p className="font-medium">{position.entry_price.toFixed(4)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Current</p>
                                <p className="font-medium">{position.current_price?.toFixed(4)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Volume</p>
                                <p className="font-medium">${position.volume}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Margin</p>
                                <p className="font-medium">${position.margin_used}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex gap-4">
                                {position.take_profit && (
                                  <span className="text-green-500">TP: {position.take_profit.toFixed(4)}</span>
                                )}
                                {position.stop_loss && (
                                  <span className="text-red-500">SL: {position.stop_loss.toFixed(4)}</span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClosePosition(position)}
                              >
                                Close Position
                              </Button>
                            </div>
                          </Card>
                        ))}

                        {positions.filter(p => p.status === 'open').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No open positions</p>
                            <p className="text-sm mt-2">Start trading to see your positions here</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chart" className="space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-2">
                    <TradingChart 
                      pairSymbol={selectedPair?.symbol || 'EUR/USD'}
                      currentPrice={selectedPair?.current_price || 1.0850}
                    />
                  </div>
                  <div className="space-y-4">
                    <OrderBook 
                      pairSymbol={selectedPair?.symbol || 'EUR/USD'}
                      currentPrice={selectedPair?.current_price || 1.0850}
                      spread={selectedPair?.spread || 0.0002}
                    />
                    <MarketSession />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bots" className="space-y-4">
                <AutomatedBots />
              </TabsContent>

              <TabsContent value="copy" className="space-y-4">
                <CopyTrading />
              </TabsContent>

              <TabsContent value="news" className="space-y-4">
                <NewsIntegration />
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Trading History</CardTitle>
                    <CardDescription>Your closed positions and trading performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4">
                        {positions.filter(p => p.status === 'closed').map((position) => (
                          <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{position.pair?.symbol}</span>
                                <Badge variant={position.position_type === 'buy' ? 'default' : 'destructive'}>
                                  {position.position_type.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Volume: ${position.volume} | Leverage: {position.leverage}x
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(position.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className={cn(
                              "text-right",
                              position.profit_loss >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                              <p className="font-semibold">
                                {position.profit_loss >= 0 ? '+' : ''}{position.profit_loss.toFixed(2)} USDT
                              </p>
                              <p className="text-sm">
                                {position.profit_loss_percent >= 0 ? '+' : ''}{position.profit_loss_percent.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        ))}

                        {positions.filter(p => p.status === 'closed').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No trading history</p>
                            <p className="text-sm mt-2">Your closed positions will appear here</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}