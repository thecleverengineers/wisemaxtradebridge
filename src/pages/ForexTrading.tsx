
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Play, 
  Pause,
  DollarSign,
  Clock,
  Target,
  Activity,
  Trophy,
  Wallet,
  BarChart3,
  ArrowUp,
  ArrowDown,
  LineChart,
  AlertTriangle,
  Signal,
  Zap,
  Globe,
  Calendar,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import io from 'socket.io-client';

interface ForexPair {
  symbol: string;
  name: string;
  category: 'major' | 'minor' | 'exotic' | 'crypto' | 'stocks' | 'commodities';
  price: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  spread: number;
  volume: number;
}

interface TradingSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  confidence: number;
  timeframe: string;
  indicators: {
    rsi: number;
    macd: number;
    sma: number;
    ema: number;
  };
  timestamp: string;
}

interface Trade {
  id: number;
  symbol: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  duration: number;
  startTime: string;
  endTime: string;
  entryPrice: number;
  exitPrice?: number;
  result: 'win' | 'loss' | 'pending';
  payout: number;
  mode: 'real' | 'demo';
}

const ForexTrading = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Trading state
  const [selectedPair, setSelectedPair] = useState<ForexPair | null>(null);
  const [tradeDirection, setTradeDirection] = useState<'UP' | 'DOWN'>('UP');
  const [stakeAmount, setStakeAmount] = useState('10');
  const [tradeDuration, setTradeDuration] = useState(60); // seconds
  const [tradingMode, setTradingMode] = useState<'real' | 'demo'>('demo');
  const [isTrading, setIsTrading] = useState(false);
  
  // Market data
  const [forexPairs, setForexPairs] = useState<ForexPair[]>([]);
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([]);
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [walletBalance, setWalletBalance] = useState({ real: 0, demo: 10000 });
  
  // Chart and analysis
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [chartType, setChartType] = useState('candlestick');
  const [showIndicators, setShowIndicators] = useState(true);
  
  // Market analysis
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null);
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);
  
  const socketRef = useRef<any>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      console.log('Connected to forex trading server');
    });

    socketRef.current.on('forexPrices', (data: ForexPair[]) => {
      setForexPairs(data);
      if (!selectedPair && data.length > 0) {
        setSelectedPair(data[0]);
      }
    });

    socketRef.current.on('tradingSignals', (signals: [string, TradingSignal][]) => {
      const signalArray = signals.map(([symbol, signal]) => signal);
      setTradingSignals(signalArray);
    });

    socketRef.current.on('tradeResult', (result: any) => {
      handleTradeResult(result);
    });

    socketRef.current.on('marketAnalysis', (analysis: any) => {
      setMarketAnalysis(analysis);
      setEconomicEvents(analysis.economicEvents || []);
    });

    // Load initial data
    loadForexData();
    loadTrades();
    loadWalletBalance();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const loadForexData = async () => {
    // Mock forex pairs data - in production, this would come from your API
    const mockPairs: ForexPair[] = [
      {
        symbol: 'EURUSD',
        name: 'Euro / US Dollar',
        category: 'major',
        price: 1.0850,
        change: 0.0023,
        changePercent: 0.21,
        bid: 1.0849,
        ask: 1.0851,
        spread: 0.0002,
        volume: 1250000
      },
      {
        symbol: 'GBPUSD',
        name: 'British Pound / US Dollar',
        category: 'major',
        price: 1.2750,
        change: -0.0045,
        changePercent: -0.35,
        bid: 1.2748,
        ask: 1.2752,
        spread: 0.0004,
        volume: 890000
      },
      {
        symbol: 'USDJPY',
        name: 'US Dollar / Japanese Yen',
        category: 'major',
        price: 148.50,
        change: 0.75,
        changePercent: 0.51,
        bid: 148.48,
        ask: 148.52,
        spread: 0.04,
        volume: 1100000
      },
      {
        symbol: 'AUDUSD',
        name: 'Australian Dollar / US Dollar',
        category: 'major',
        price: 0.6720,
        change: 0.0012,
        changePercent: 0.18,
        bid: 0.6719,
        ask: 0.6721,
        spread: 0.0002,
        volume: 650000
      },
      {
        symbol: 'BTCUSD',
        name: 'Bitcoin / US Dollar',
        category: 'crypto',
        price: 42500,
        change: 850,
        changePercent: 2.04,
        bid: 42485,
        ask: 42515,
        spread: 30,
        volume: 45000
      }
    ];
    
    setForexPairs(mockPairs);
    setSelectedPair(mockPairs[0]);
  };

  const loadTrades = async () => {
    // Mock implementation - replace with actual API calls
    setActiveTrades([]);
    setTradeHistory([]);
  };

  const loadWalletBalance = async () => {
    // Mock implementation - replace with actual API calls
    setWalletBalance({ real: 1250.50, demo: 9875.25 });
  };

  const placeTrade = async () => {
    if (!selectedPair || !stakeAmount) {
      toast({
        title: "Invalid Trade",
        description: "Please select a currency pair and enter stake amount",
        variant: "destructive",
      });
      return;
    }

    const stake = parseFloat(stakeAmount);
    const currentBalance = tradingMode === 'real' ? walletBalance.real : walletBalance.demo;
    
    if (stake > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need $${stake} but only have $${currentBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setIsTrading(true);
    
    try {
      // Simulate trade placement
      const newTrade: Trade = {
        id: Date.now(),
        symbol: selectedPair.symbol,
        direction: tradeDirection,
        stake,
        duration: tradeDuration,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + tradeDuration * 1000).toISOString(),
        entryPrice: selectedPair.price,
        result: 'pending',
        payout: 0,
        mode: tradingMode
      };

      setActiveTrades(prev => [...prev, newTrade]);
      
      // Update balance
      const newBalance = currentBalance - stake;
      setWalletBalance(prev => ({
        ...prev,
        [tradingMode]: newBalance
      }));

      toast({
        title: "Trade Placed Successfully",
        description: `${tradeDirection} trade on ${selectedPair.symbol} for $${stake}`,
      });

      // Simulate trade settlement after duration
      setTimeout(() => {
        const isWin = Math.random() > 0.45; // 55% win rate
        const payout = isWin ? stake * 1.85 : 0; // 85% return

        const settledTrade = {
          ...newTrade,
          exitPrice: selectedPair.price * (1 + (Math.random() - 0.5) * 0.02),
          result: isWin ? 'win' : 'loss' as 'win' | 'loss',
          payout
        };

        setActiveTrades(prev => prev.filter(t => t.id !== newTrade.id));
        setTradeHistory(prev => [settledTrade, ...prev]);

        if (isWin) {
          setWalletBalance(prev => ({
            ...prev,
            [tradingMode]: prev[tradingMode] + payout
          }));
        }

        toast({
          title: isWin ? "Trade Won! 🎉" : "Trade Lost 😔",
          description: isWin 
            ? `You won $${payout.toFixed(2)}` 
            : `You lost $${stake.toFixed(2)}`,
          variant: isWin ? "default" : "destructive",
        });
      }, tradeDuration * 1000);

    } catch (error) {
      toast({
        title: "Trade Failed",
        description: "Failed to place trade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTrading(false);
    }
  };

  const handleTradeResult = (result: any) => {
    // Handle real-time trade results from server
    console.log('Trade result received:', result);
  };

  const getSignalForPair = (symbol: string) => {
    return tradingSignals.find(signal => signal.symbol === symbol);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((end - now) / 1000));
    return diff;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AppHeader onMenuClick={() => {}} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Trading Mode & Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setTradingMode('demo')}
                variant={tradingMode === 'demo' ? 'default' : 'outline'}
                className={`${tradingMode === 'demo' 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' 
                  : 'border-blue-500/30 text-blue-300 hover:bg-blue-600/20'
                }`}
              >
                <Activity className="h-4 w-4 mr-2" />
                Demo Mode
              </Button>
              <Button
                onClick={() => setTradingMode('real')}
                variant={tradingMode === 'real' ? 'default' : 'outline'}
                className={`${tradingMode === 'real' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                  : 'border-green-500/30 text-green-300 hover:bg-green-600/20'
                }`}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Real Mode
              </Button>
            </div>
            
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Wallet className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-purple-300 text-sm">
                      {tradingMode === 'real' ? 'Real Balance' : 'Demo Balance'}
                    </p>
                    <p className="text-white font-semibold text-lg">
                      ${(tradingMode === 'real' ? walletBalance.real : walletBalance.demo).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Market Watch & Signals */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-purple-400" />
                    Market Watch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {forexPairs.map((pair) => {
                    const signal = getSignalForPair(pair.symbol);
                    return (
                      <div
                        key={pair.symbol}
                        onClick={() => setSelectedPair(pair)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedPair?.symbol === pair.symbol 
                            ? 'bg-purple-600/30 border border-purple-500/50' 
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-white font-semibold text-sm">{pair.symbol}</h3>
                            <p className="text-purple-300 text-xs">{pair.name}</p>
                          </div>
                          {signal && (
                            <Badge 
                              className={`text-xs ${
                                signal.signal === 'BUY' 
                                  ? 'bg-green-600' 
                                  : signal.signal === 'SELL' 
                                  ? 'bg-red-600' 
                                  : 'bg-gray-600'
                              }`}
                            >
                              {signal.signal}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {pair.price.toFixed(pair.symbol.includes('JPY') ? 2 : 4)}
                            </p>
                            <p className={`text-xs ${
                              pair.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {pair.changePercent >= 0 ? '+' : ''}
                              {pair.changePercent.toFixed(2)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-purple-300 text-xs">
                              Spread: {pair.spread.toFixed(pair.symbol.includes('JPY') ? 2 : 4)}
                            </p>
                            <div className="flex items-center space-x-1">
                              {signal && (
                                <Signal className={`h-3 w-3 ${
                                  signal.strength === 'STRONG' 
                                    ? 'text-green-400' 
                                    : signal.strength === 'MODERATE' 
                                    ? 'text-yellow-400' 
                                    : 'text-gray-400'
                                }`} />
                              )}
                              <span className="text-xs text-purple-300">
                                {signal?.confidence}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Trading Signals */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                    Trading Signals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tradingSignals.slice(0, 5).map((signal) => (
                    <div key={signal.symbol} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-sm">{signal.symbol}</span>
                        <Badge className={`text-xs ${
                          signal.signal === 'BUY' 
                            ? 'bg-green-600' 
                            : signal.signal === 'SELL' 
                            ? 'bg-red-600' 
                            : 'bg-gray-600'
                        }`}>
                          {signal.signal}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-purple-300">Strength:</span>
                          <span className={`${
                            signal.strength === 'STRONG' ? 'text-green-400' : 
                            signal.strength === 'MODERATE' ? 'text-yellow-400' : 'text-gray-400'
                          }`}>
                            {signal.strength}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-purple-300">RSI:</span>
                          <span className="text-white">{signal.indicators.rsi}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-purple-300">Confidence:</span>
                          <span className="text-white">{signal.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Chart & Analysis */}
            <div className="lg:col-span-6 space-y-4">
              {/* Chart Controls */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                        <SelectTrigger className="w-20 bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1M">1M</SelectItem>
                          <SelectItem value="5M">5M</SelectItem>
                          <SelectItem value="15M">15M</SelectItem>
                          <SelectItem value="1H">1H</SelectItem>
                          <SelectItem value="4H">4H</SelectItem>
                          <SelectItem value="1D">1D</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowIndicators(!showIndicators)}
                        className={`border-white/20 ${showIndicators ? 'bg-purple-600/20' : ''}`}
                      >
                        <LineChart className="h-4 w-4 mr-1" />
                        Indicators
                      </Button>
                    </div>
                    
                    {selectedPair && (
                      <div className="text-right">
                        <h2 className="text-white font-semibold">{selectedPair.symbol}</h2>
                        <p className="text-purple-300 text-sm">{selectedPair.name}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Price Chart */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  {selectedPair && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-2">
                          {selectedPair.price.toFixed(selectedPair.symbol.includes('JPY') ? 2 : 4)}
                        </div>
                        <div className={`text-lg flex items-center justify-center space-x-2 ${
                          selectedPair.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {selectedPair.changePercent >= 0 ? 
                            <ArrowUp className="h-4 w-4" /> : 
                            <ArrowDown className="h-4 w-4" />
                          }
                          <span>
                            {selectedPair.changePercent >= 0 ? '+' : ''}
                            {selectedPair.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Mock Chart Area */}
                      <div className="h-64 bg-slate-800/50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                          <p className="text-purple-300">
                            Live {selectedPair.symbol} Chart
                          </p>
                          <p className="text-purple-400 text-sm">
                            Real-time price data with technical indicators
                          </p>
                        </div>
                      </div>

                      {/* Technical Indicators */}
                      {showIndicators && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white/5 p-3 rounded-lg">
                            <p className="text-purple-300 text-xs">RSI (14)</p>
                            <p className="text-white font-semibold">65.4</p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-lg">
                            <p className="text-purple-300 text-xs">MACD</p>
                            <p className="text-green-400 font-semibold">+0.0012</p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-lg">
                            <p className="text-purple-300 text-xs">SMA (20)</p>
                            <p className="text-white font-semibold">
                              {(selectedPair.price * 0.998).toFixed(4)}
                            </p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-lg">
                            <p className="text-purple-300 text-xs">EMA (12)</p>
                            <p className="text-white font-semibold">
                              {(selectedPair.price * 1.002).toFixed(4)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Economic Calendar */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                    Economic Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {economicEvents.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge className={`${
                            event.impact === 'HIGH' ? 'bg-red-600' : 
                            event.impact === 'MEDIUM' ? 'bg-yellow-600' : 'bg-green-600'
                          }`}>
                            {event.impact}
                          </Badge>
                          <div>
                            <p className="text-white font-medium text-sm">{event.event}</p>
                            <p className="text-purple-300 text-xs">{event.country} - {event.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm">F: {event.forecast}</p>
                          <p className="text-purple-300 text-xs">P: {event.previous}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trading Panel & History */}
            <div className="lg:col-span-3 space-y-4">
              {/* Trading Panel */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Quick Trade</CardTitle>
                  <CardDescription className="text-purple-300">
                    Binary Options Trading
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Direction Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setTradeDirection('UP')}
                      className={`h-16 ${
                        tradeDirection === 'UP' 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                          : 'bg-white/10 hover:bg-white/20 border border-green-500/30'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <ArrowUp className="h-6 w-6" />
                        <span>CALL</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setTradeDirection('DOWN')}
                      className={`h-16 ${
                        tradeDirection === 'DOWN' 
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700' 
                          : 'bg-white/10 hover:bg-white/20 border border-red-500/30'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <ArrowDown className="h-6 w-6" />
                        <span>PUT</span>
                      </div>
                    </Button>
                  </div>

                  {/* Stake Amount */}
                  <div>
                    <label className="text-white text-sm">Investment Amount ($)</label>
                    <Input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Enter amount"
                    />
                    <div className="flex space-x-2 mt-2">
                      {[10, 25, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setStakeAmount(amount.toString())}
                          className="border-white/20 text-purple-300 hover:bg-purple-600/20"
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-white text-sm">Expiry Time</label>
                    <Select value={tradeDuration.toString()} onValueChange={(value) => setTradeDuration(parseInt(value))}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="180">3 minutes</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="900">15 minutes</SelectItem>
                        <SelectItem value="1800">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Trade Summary */}
                  {selectedPair && stakeAmount && (
                    <div className="bg-white/5 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Investment:</span>
                        <span className="text-white">${parseFloat(stakeAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Payout:</span>
                        <span className="text-green-400">85%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Profit:</span>
                        <span className="text-green-400">
                          ${(parseFloat(stakeAmount) * 0.85).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-purple-300">Total Return:</span>
                        <span className="text-white">
                          ${(parseFloat(stakeAmount) * 1.85).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={placeTrade}
                    disabled={isTrading || !selectedPair || !stakeAmount}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12"
                  >
                    {isTrading ? 'Placing Trade...' : `Trade ${tradeDirection}`}
                  </Button>
                </CardContent>
              </Card>

              {/* Active Trades & History */}
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger value="active">Active ({activeTrades.length})</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Active Positions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activeTrades.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                          <p className="text-purple-300">No active trades</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeTrades.map((trade) => (
                            <div key={trade.id} className="p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Badge className={trade.direction === 'UP' ? 'bg-green-600' : 'bg-red-600'}>
                                    {trade.direction}
                                  </Badge>
                                  <span className="text-white font-medium">{trade.symbol}</span>
                                </div>
                                <span className="text-white font-semibold">${trade.stake}</span>
                              </div>
                              
                              <div className="text-xs text-purple-300 space-y-1">
                                <div>Entry: ${trade.entryPrice.toFixed(4)}</div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-3 w-3" />
                                  <span>Time Left: {formatTime(getTimeLeft(trade.endTime))}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Trade History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tradeHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <BarChart3 className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                          <p className="text-purple-300">No trade history</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {tradeHistory.slice(0, 10).map((trade) => (
                            <div key={trade.id} className="p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Badge className={trade.direction === 'UP' ? 'bg-green-600' : 'bg-red-600'}>
                                    {trade.direction}
                                  </Badge>
                                  <span className="text-white font-medium">{trade.symbol}</span>
                                  <Badge className={trade.result === 'win' ? 'bg-green-600' : 'bg-red-600'}>
                                    {trade.result === 'win' ? 'WIN' : 'LOSS'}
                                  </Badge>
                                </div>
                                <span className={`font-semibold ${
                                  trade.result === 'win' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {trade.result === 'win' ? '+' : '-'}${trade.result === 'win' ? trade.payout.toFixed(2) : trade.stake.toFixed(2)}
                                </span>
                              </div>
                              
                              <div className="text-xs text-purple-300 space-y-1">
                                <div>Entry: ${trade.entryPrice.toFixed(4)} | Exit: ${(trade.exitPrice || 0).toFixed(4)}</div>
                                <div>{new Date(trade.startTime).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ForexTrading;
