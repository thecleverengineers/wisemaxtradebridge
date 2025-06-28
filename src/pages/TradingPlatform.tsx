
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
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
  Signal,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  Flame,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import io from 'socket.io-client';

interface Asset {
  id: number;
  symbol: string;
  name: string;
  category: string;
  return_percent: number;
  status: string;
}

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
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
    macdSignal: number;
    bb_upper: number;
    bb_lower: number;
    sma20: number;
    ema12: number;
  };
  recommendation: string;
}

interface Trade {
  id: number;
  asset_symbol: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  entry_price: number;
  exit_price?: number;
  result: 'win' | 'loss' | 'pending';
  payout: number;
  mode: 'real' | 'demo';
  current_price?: number;
  unrealized_pnl?: string;
}

interface MarketAnalysis {
  marketSentiment: {
    overall: string;
    strength: number;
    volatility: number;
  };
  topMovers: Array<{
    symbol: string;
    change: number;
    price: number;
  }>;
  signals: TradingSignal[];
  economicEvents: Array<{
    time: string;
    country: string;
    event: string;
    impact: string;
    forecast: string;
    previous: string;
  }>;
}

const TradingPlatform = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [assets, setAssets] = useState<Asset[]>([]);
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [tradeDirection, setTradeDirection] = useState<'UP' | 'DOWN'>('UP');
  const [stakeAmount, setStakeAmount] = useState('10');
  const [tradeDuration, setTradeDuration] = useState(60);
  const [tradingMode, setTradingMode] = useState<'real' | 'demo'>('demo');
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [walletBalance, setWalletBalance] = useState({ real: 0, demo: 10000 });
  const [isTrading, setIsTrading] = useState(false);
  const [tradingSignals, setTradingSignals] = useState<Map<string, TradingSignal>>(new Map());
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('trading');
  
  // Real-time data
  const [countdown, setCountdown] = useState<Map<number, number>>(new Map());
  
  // WebSocket connection
  const socketRef = useRef<any>(null);
  const countdownIntervals = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      console.log('Connected to trading server');
      socketRef.current.emit('join', `user_${user?.id}`);
    });

    socketRef.current.on('priceUpdate', (priceData: Record<string, PriceData>) => {
      const priceMap = new Map();
      Object.entries(priceData).forEach(([symbol, data]) => {
        priceMap.set(symbol, data);
      });
      setPrices(priceMap);
    });

    socketRef.current.on('tradingSignals', (signals: Array<[string, TradingSignal]>) => {
      const signalMap = new Map();
      signals.forEach(([symbol, signal]) => {
        signalMap.set(symbol, signal);
      });
      setTradingSignals(signalMap);
    });

    socketRef.current.on('tradeResult', (tradeResult: any) => {
      handleTradeResult(tradeResult);
    });

    socketRef.current.on('tradeUpdate', (updatedTrade: Trade) => {
      setActiveTrades(prev => 
        prev.map(trade => 
          trade.id === updatedTrade.id ? updatedTrade : trade
        )
      );
    });

    // Load initial data
    loadAssets();
    loadTrades();
    loadWalletBalance();
    loadMarketAnalysis();
    loadUserStats();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // Clear all intervals
      countdownIntervals.current.forEach(interval => clearInterval(interval));
    };
  }, [user]);

  const loadAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      setAssets(data);
      if (data.length > 0) {
        setSelectedAsset(data[0]);
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast({
        title: "Error",
        description: "Failed to load trading assets",
        variant: "destructive",
      });
    }
  };

  const loadTrades = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/trades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      
      const pending = data.filter((trade: Trade) => trade.result === 'pending');
      const completed = data.filter((trade: Trade) => trade.result !== 'pending');
      
      setActiveTrades(pending);
      setTradeHistory(completed);
      
      // Start countdown for active trades
      pending.forEach((trade: Trade) => {
        startTradeCountdown(trade);
      });
    } catch (error) {
      console.error('Failed to load trades:', error);
    }
  };

  const startTradeCountdown = (trade: Trade) => {
    const endTime = new Date(trade.end_time).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setCountdown(prev => new Map(prev.set(trade.id, timeLeft)));
      
      if (timeLeft <= 0) {
        clearInterval(interval);
        countdownIntervals.current.delete(trade.id);
      }
    }, 1000);
    
    countdownIntervals.current.set(trade.id, interval);
  };

  const loadWalletBalance = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      setWalletBalance({
        real: data.wallet_real || 0,
        demo: data.wallet_demo || 10000
      });
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
    }
  };

  const loadMarketAnalysis = async () => {
    try {
      const response = await fetch('/api/market-analysis');
      if (response.ok) {
        const data = await response.json();
        setMarketAnalysis(data);
      }
    } catch (error) {
      console.error('Failed to load market analysis:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/trading-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const placeTrade = async () => {
    if (!selectedAsset || !stakeAmount) {
      toast({
        title: "Invalid Trade",
        description: "Please select an asset and enter stake amount",
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

    const currentPrice = prices.get(selectedAsset.symbol);
    if (!currentPrice) {
      toast({
        title: "Price Unavailable",
        description: "Current price not available for this asset",
        variant: "destructive",
      });
      return;
    }

    setIsTrading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          direction: tradeDirection,
          stake: stake,
          duration: Math.floor(tradeDuration / 60),
          mode: tradingMode,
          entryPrice: currentPrice.price
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Trade Placed! 🎯",
          description: `${tradeDirection} trade on ${selectedAsset.symbol} for $${stake}`,
        });
        
        // Refresh data
        loadTrades();
        loadWalletBalance();
        loadUserStats();
        
        // Start countdown for new trade
        if (result.trade) {
          startTradeCountdown(result.trade);
        }
      } else {
        toast({
          title: "Trade Failed",
          description: result.error || "Failed to place trade",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Trade placement error:', error);
      toast({
        title: "Trade Failed",
        description: "Network error while placing trade",
        variant: "destructive",
      });
    } finally {
      setIsTrading(false);
    }
  };

  const handleTradeResult = (tradeResult: any) => {
    const { trade, isWin, payout } = tradeResult;
    
    // Clear countdown
    const interval = countdownIntervals.current.get(trade.id);
    if (interval) {
      clearInterval(interval);
      countdownIntervals.current.delete(trade.id);
    }
    
    // Update trades
    setActiveTrades(prev => prev.filter(t => t.id !== trade.id));
    setTradeHistory(prev => [trade, ...prev.slice(0, 49)]);
    
    // Clear countdown state
    setCountdown(prev => {
      const newCountdown = new Map(prev);
      newCountdown.delete(trade.id);
      return newCountdown;
    });
    
    // Show result notification
    toast({
      title: isWin ? "🎉 Trade Won!" : "😔 Trade Lost",
      description: isWin 
        ? `Congratulations! You won $${payout.toFixed(2)}` 
        : `You lost $${trade.stake.toFixed(2)}. Better luck next time!`,
      variant: isWin ? "default" : "destructive",
    });
    
    // Refresh data
    loadWalletBalance();
    loadUserStats();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPrice = (symbol: string) => {
    const priceData = prices.get(symbol);
    return priceData ? priceData.price : 0;
  };

  const getPriceChange = (symbol: string) => {
    const priceData = prices.get(symbol);
    return priceData ? priceData.changePercent : 0;
  };

  const getSignalForAsset = (symbol: string) => {
    return tradingSignals.get(symbol);
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-400';
      case 'SELL': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY': return TrendingUp;
      case 'SELL': return TrendingDown;
      default: return Signal;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AppHeader onMenuClick={() => {}} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">
                      {tradingMode === 'real' ? 'Real Balance' : 'Demo Balance'}
                    </p>
                    <p className="text-2xl font-bold">
                      ${(tradingMode === 'real' ? walletBalance.real : walletBalance.demo).toFixed(2)}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-blue-100" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Win Rate</p>
                    <p className="text-2xl font-bold">
                      {userStats ? `${userStats.win_rate.toFixed(1)}%` : '0%'}
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-green-100" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Total Trades</p>
                    <p className="text-2xl font-bold">
                      {userStats ? userStats.total_trades : '0'}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-100" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-600 to-red-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">P&L</p>
                    <p className={`text-2xl font-bold ${
                      userStats && userStats.profit_loss >= 0 ? 'text-green-100' : 'text-red-100'
                    }`}>
                      ${userStats ? userStats.profit_loss.toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-100" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setTradingMode('demo')}
                variant={tradingMode === 'demo' ? 'default' : 'outline'}
                className={`${tradingMode === 'demo' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-600 text-blue-400 hover:bg-blue-600/20'}`}
              >
                <Play className="h-4 w-4 mr-2" />
                Demo Mode
              </Button>
              <Button
                onClick={() => setTradingMode('real')}
                variant={tradingMode === 'real' ? 'default' : 'outline'}
                className={`${tradingMode === 'real' ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-400 hover:bg-green-600/20'}`}
              >
                <Zap className="h-4 w-4 mr-2" />
                Real Mode
              </Button>
            </div>
            
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <Activity className="h-3 w-3 mr-1" />
              {activeTrades.length} Active Trades
            </Badge>
          </div>

          {/* Main Trading Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="trading">
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Asset Selection */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        Select Asset
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {assets.map((asset) => {
                          const signal = getSignalForAsset(asset.symbol);
                          const SignalIcon = signal ? getSignalIcon(signal.signal) : Signal;
                          
                          return (
                            <div
                              key={asset.id}
                              onClick={() => setSelectedAsset(asset)}
                              className={`p-4 rounded-lg cursor-pointer transition-all ${
                                selectedAsset?.id === asset.id 
                                  ? 'bg-purple-600/20 border border-purple-500/30' 
                                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="text-white font-semibold">{asset.symbol}</h3>
                                  <p className="text-purple-300 text-sm">{asset.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-semibold">
                                    ${getCurrentPrice(asset.symbol).toFixed(4)}
                                  </p>
                                  <p className={`text-sm ${
                                    getPriceChange(asset.symbol) >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {getPriceChange(asset.symbol) >= 0 ? '+' : ''}
                                    {getPriceChange(asset.symbol).toFixed(2)}%
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Badge className="bg-green-600 text-white">
                                  {asset.return_percent}% Return
                                </Badge>
                                
                                {signal && (
                                  <div className="flex items-center space-x-1">
                                    <SignalIcon className={`h-4 w-4 ${getSignalColor(signal.signal)}`} />
                                    <span className={`text-xs ${getSignalColor(signal.signal)}`}>
                                      {signal.signal}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {signal && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-purple-300 text-xs">Confidence</span>
                                    <span className="text-white text-xs">{signal.confidence}%</span>
                                  </div>
                                  <Progress 
                                    value={signal.confidence} 
                                    className="h-1 mt-1"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live Price Display */}
                  {selectedAsset && (
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center space-x-2">
                            <h2 className="text-2xl font-bold text-white">
                              {selectedAsset.symbol}
                            </h2>
                            <Badge className="bg-blue-600">{selectedAsset.category}</Badge>
                          </div>
                          
                          <div className="text-4xl font-bold text-white">
                            ${getCurrentPrice(selectedAsset.symbol).toFixed(4)}
                          </div>
                          
                          <div className={`text-lg flex items-center justify-center space-x-2 ${
                            getPriceChange(selectedAsset.symbol) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {getPriceChange(selectedAsset.symbol) >= 0 ? 
                              <TrendingUp className="h-5 w-5" /> : 
                              <TrendingDown className="h-5 w-5" />
                            }
                            <span>
                              {getPriceChange(selectedAsset.symbol) >= 0 ? '+' : ''}
                              {getPriceChange(selectedAsset.symbol).toFixed(2)}%
                            </span>
                          </div>
                          
                          {getSignalForAsset(selectedAsset.symbol) && (
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-purple-300 text-sm">AI Recommendation</p>
                              <p className="text-white text-sm mt-1">
                                {getSignalForAsset(selectedAsset.symbol)?.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Trading Panel */}
                <div className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Flame className="h-5 w-5 mr-2" />
                        Place Trade
                      </CardTitle>
                      <CardDescription className="text-purple-300">
                        Predict price direction to win
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Direction Selection */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => setTradeDirection('UP')}
                          className={`h-16 ${
                            tradeDirection === 'UP' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <ArrowUp className="h-6 w-6" />
                            <span className="font-semibold">UP</span>
                            <span className="text-xs opacity-75">Higher</span>
                          </div>
                        </Button>
                        <Button
                          onClick={() => setTradeDirection('DOWN')}
                          className={`h-16 ${
                            tradeDirection === 'DOWN' 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <ArrowDown className="h-6 w-6" />
                            <span className="font-semibold">DOWN</span>
                            <span className="text-xs opacity-75">Lower</span>
                          </div>
                        </Button>
                      </div>

                      {/* Stake Amount */}
                      <div>
                        <label className="text-white text-sm font-medium">Stake Amount ($)</label>
                        <Input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="bg-white/5 border-white/10 text-white mt-1"
                          placeholder="Enter amount"
                          min="1"
                          max={tradingMode === 'real' ? walletBalance.real : walletBalance.demo}
                        />
                        <div className="flex space-x-2 mt-2">
                          {[10, 25, 50, 100].map((amount) => (
                            <Button
                              key={amount}
                              variant="outline"
                              size="sm"
                              onClick={() => setStakeAmount(amount.toString())}
                              className="border-white/20 text-purple-300 hover:bg-white/10"
                            >
                              ${amount}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="text-white text-sm font-medium">Duration</label>
                        <Select value={tradeDuration.toString()} onValueChange={(value) => setTradeDuration(parseInt(value))}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
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
                      {selectedAsset && stakeAmount && (
                        <div className="bg-white/5 rounded-lg p-4 space-y-2">
                          <h4 className="text-white font-medium">Trade Summary</h4>
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-300">Asset:</span>
                            <span className="text-white">{selectedAsset.symbol}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-300">Direction:</span>
                            <span className={`font-medium ${tradeDirection === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                              {tradeDirection}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-300">Stake:</span>
                            <span className="text-white">${parseFloat(stakeAmount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-300">Duration:</span>
                            <span className="text-white">{formatTime(tradeDuration)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-300">Potential Profit:</span>
                            <span className="text-green-400 font-medium">
                              ${((parseFloat(stakeAmount) * selectedAsset.return_percent) / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2">
                            <span className="text-purple-300">Total Return:</span>
                            <span className="text-white">
                              ${(parseFloat(stakeAmount) + (parseFloat(stakeAmount) * selectedAsset.return_percent) / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={placeTrade}
                        disabled={isTrading || !selectedAsset || !stakeAmount || parseFloat(stakeAmount) <= 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 font-semibold"
                      >
                        {isTrading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Placing Trade...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Play className="h-4 w-4 mr-2" />
                            Place Trade
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Active Trades */}
                <div className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center">
                        <Timer className="h-4 w-4 mr-2" />
                        Active Trades ({activeTrades.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activeTrades.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 text-purple-400 mx-auto mb-4 opacity-50" />
                          <p className="text-purple-300">No active trades</p>
                          <p className="text-purple-400 text-sm">Place a trade to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {activeTrades.map((trade) => {
                            const timeLeft = countdown.get(trade.id) || 0;
                            const progress = ((trade.duration_minutes * 60 - timeLeft) / (trade.duration_minutes * 60)) * 100;
                            
                            return (
                              <div key={trade.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Badge className={trade.direction === 'UP' ? 'bg-green-600' : 'bg-red-600'}>
                                      {trade.direction}
                                    </Badge>
                                    <span className="text-white font-medium">{trade.asset_symbol}</span>
                                    {trade.unrealized_pnl && (
                                      <Badge className={trade.unrealized_pnl === 'winning' ? 'bg-green-600' : 'bg-red-600'}>
                                        {trade.unrealized_pnl}
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-white font-semibold">${trade.stake}</span>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs text-purple-300">
                                    <span>Entry: ${trade.entry_price.toFixed(4)}</span>
                                    <span>Current: ${trade.current_price?.toFixed(4) || 'Loading...'}</span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-white font-medium">
                                      {formatTime(timeLeft)}
                                    </span>
                                    <span className="text-xs text-purple-300">
                                      {progress.toFixed(0)}% Complete
                                    </span>
                                  </div>
                                  
                                  <Progress value={progress} className="h-2" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signals">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    AI Trading Signals
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    Real-time market analysis and trading recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(tradingSignals.entries()).map(([symbol, signal]) => {
                      const SignalIcon = getSignalIcon(signal.signal);
                      return (
                        <div key={symbol} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-semibold">{symbol}</h3>
                            <div className="flex items-center space-x-2">
                              <SignalIcon className={`h-4 w-4 ${getSignalColor(signal.signal)}`} />
                              <span className={`text-sm font-medium ${getSignalColor(signal.signal)}`}>
                                {signal.signal}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-purple-300 text-sm">Strength</span>
                              <Badge className={`${
                                signal.strength === 'STRONG' ? 'bg-green-600' :
                                signal.strength === 'MODERATE' ? 'bg-yellow-600' : 'bg-gray-600'
                              }`}>
                                {signal.strength}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-purple-300 text-sm">Confidence</span>
                              <span className="text-white text-sm">{signal.confidence}%</span>
                            </div>
                            
                            <Progress value={signal.confidence} className="h-2" />
                            
                            <div className="mt-3 p-2 bg-white/10 rounded text-xs text-purple-200">
                              {signal.recommendation}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis">
              {marketAnalysis && (
                <div className="space-y-6">
                  {/* Market Sentiment */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Market Sentiment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-purple-300 text-sm">Overall Market</p>
                          <p className={`text-2xl font-bold ${
                            marketAnalysis.marketSentiment.overall === 'BULLISH' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {marketAnalysis.marketSentiment.overall}
                          </p>
                          <p className="text-purple-300 text-sm">
                            Strength: {marketAnalysis.marketSentiment.strength}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-purple-300 text-sm">Volatility</p>
                          <p className="text-2xl font-bold text-yellow-400">
                            {marketAnalysis.marketSentiment.volatility}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-purple-300 text-sm">Market Health</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {marketAnalysis.marketSentiment.strength > 70 ? 'Strong' : 
                             marketAnalysis.marketSentiment.strength > 40 ? 'Moderate' : 'Weak'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Movers */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Top Movers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {marketAnalysis.topMovers.map((mover, index) => (
                          <div key={mover.symbol} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-white font-medium">{mover.symbol}</p>
                                <p className="text-purple-300 text-sm">${mover.price.toFixed(4)}</p>
                              </div>
                            </div>
                            <div className={`text-right ${mover.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              <p className="font-medium">
                                {mover.change >= 0 ? '+' : ''}{mover.change.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Economic Events */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Economic Calendar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {marketAnalysis.economicEvents.map((event, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Badge className={`${
                                event.impact === 'HIGH' ? 'bg-red-600' :
                                event.impact === 'MEDIUM' ? 'bg-yellow-600' : 'bg-green-600'
                              }`}>
                                {event.impact}
                              </Badge>
                              <div>
                                <p className="text-white font-medium">{event.event}</p>
                                <p className="text-purple-300 text-sm">{event.country} • {event.time}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white text-sm">Forecast: {event.forecast}</p>
                              <p className="text-purple-300 text-sm">Previous: {event.previous}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Trade History</CardTitle>
                  <CardDescription className="text-purple-300">
                    Your recent trading activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tradeHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-purple-400 mx-auto mb-4 opacity-50" />
                      <p className="text-purple-300">No trade history</p>
                      <p className="text-purple-400 text-sm">Your completed trades will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {tradeHistory.map((trade) => (
                        <div key={trade.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <Badge className={trade.direction === 'UP' ? 'bg-green-600' : 'bg-red-600'}>
                                {trade.direction}
                              </Badge>
                              <span className="text-white font-medium">{trade.asset_symbol}</span>
                              <Badge className={`${
                                trade.result === 'win' ? 'bg-green-600' : 'bg-red-600'
                              }`}>
                                {trade.result === 'win' ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {trade.result.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${
                                trade.result === 'win' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {trade.result === 'win' ? '+' : '-'}${
                                  trade.result === 'win' ? trade.payout.toFixed(2) : trade.stake.toFixed(2)
                                }
                              </p>
                              <p className="text-purple-300 text-sm">
                                {trade.mode === 'real' ? 'Real' : 'Demo'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-purple-300">Entry Price</p>
                              <p className="text-white">${trade.entry_price.toFixed(4)}</p>
                            </div>
                            <div>
                              <p className="text-purple-300">Exit Price</p>
                              <p className="text-white">${(trade.exit_price || 0).toFixed(4)}</p>
                            </div>
                            <div>
                              <p className="text-purple-300">Stake</p>
                              <p className="text-white">${trade.stake.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-purple-300">Duration</p>
                              <p className="text-white">{trade.duration_minutes}m</p>
                            </div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-purple-300 text-xs">
                              {new Date(trade.start_time).toLocaleString()}
                            </p>
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

      <BottomNavigation />
    </div>
  );
};

export default TradingPlatform;
