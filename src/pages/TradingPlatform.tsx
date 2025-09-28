
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
  ArrowDown
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
  symbol: string;
  price: number;
  timestamp: number;
  change24h: number;
  changePercent24h: number;
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
  const [tradeDuration, setTradeDuration] = useState(60); // seconds
  const [tradingMode, setTradingMode] = useState<'real' | 'demo'>('demo');
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [walletBalance, setWalletBalance] = useState({ real: 0, demo: 10000 });
  const [isTrading, setIsTrading] = useState(false);
  
  // WebSocket connection
  const socketRef = useRef<any>(null);
  const activeTradeTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      console.log('Connected to trading server');
    });

    socketRef.current.on('priceUpdate', (priceData: PriceData[]) => {
      const priceMap = new Map();
      priceData.forEach(price => {
        priceMap.set(price.symbol, price);
      });
      setPrices(priceMap);
    });

    socketRef.current.on('tradeResult', (tradeResult: any) => {
      handleTradeResult(tradeResult);
    });

    // Load initial data
    loadAssets();
    loadTrades();
    loadWalletBalance();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // Clear all timers
      activeTradeTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

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
      const data = await response.json();
      
      const pending = data.filter((trade: Trade) => trade.result === 'pending');
      const completed = data.filter((trade: Trade) => trade.result !== 'pending');
      
      setActiveTrades(pending);
      setTradeHistory(completed);
      
      // Set timers for active trades
      pending.forEach((trade: Trade) => {
        const endTime = new Date(trade.end_time).getTime();
        const now = Date.now();
        const timeLeft = endTime - now;
        
        if (timeLeft > 0) {
          const timer = setTimeout(() => {
            checkTradeResult(trade.id);
          }, timeLeft);
          activeTradeTimers.current.set(trade.id, timer);
        }
      });
    } catch (error) {
      console.error('Failed to load trades:', error);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setWalletBalance({
        real: data.wallet_real,
        demo: data.wallet_demo
      });
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
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
        description: `You need $${stake} but only have $${currentBalance}`,
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
          duration: Math.floor(tradeDuration / 60), // Convert to minutes
          mode: tradingMode,
          entryPrice: currentPrice.price
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Trade Placed",
          description: `${tradeDirection} trade on ${selectedAsset.symbol} for $${stake}`,
        });
        
        // Refresh data
        loadTrades();
        loadWalletBalance();
        
        // Set timer for trade result
        const endTime = new Date(result.endTime).getTime();
        const timeLeft = endTime - Date.now();
        
        const timer = setTimeout(() => {
          checkTradeResult(result.tradeId);
        }, timeLeft);
        
        activeTradeTimers.current.set(result.tradeId, timer);
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

  const checkTradeResult = async (tradeId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/trades/${tradeId}/result`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        handleTradeResult(result);
      }
    } catch (error) {
      console.error('Failed to check trade result:', error);
    }
  };

  const handleTradeResult = (tradeResult: any) => {
    const { trade, isWin, payout } = tradeResult;
    
    // Clear timer
    const timer = activeTradeTimers.current.get(trade.id);
    if (timer) {
      clearTimeout(timer);
      activeTradeTimers.current.delete(trade.id);
    }
    
    // Update trades
    setActiveTrades(prev => prev.filter(t => t.id !== trade.id));
    setTradeHistory(prev => [trade, ...prev]);
    
    // Show result notification
    toast({
      title: isWin ? "Trade Won! 🎉" : "Trade Lost 😔",
      description: isWin 
        ? `You won $${payout.toFixed(2)}` 
        : `You lost $${trade.stake.toFixed(2)}`,
      variant: isWin ? "default" : "destructive",
    });
    
    // Refresh wallet balance
    loadWalletBalance();
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

  const getCurrentPrice = (symbol: string) => {
    const priceData = prices.get(symbol);
    return priceData ? priceData.price : 0;
  };

  const getPriceChange = (symbol: string) => {
    const priceData = prices.get(symbol);
    return priceData ? priceData.changePercent24h : 0;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AppHeader onMenuClick={() => {}} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Trading Mode & Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setTradingMode('demo')}
                variant={tradingMode === 'demo' ? 'default' : 'outline'}
                className={tradingMode === 'demo' ? 'bg-blue-600' : ''}
              >
                Demo Mode
              </Button>
              <Button
                onClick={() => setTradingMode('real')}
                variant={tradingMode === 'real' ? 'default' : 'outline'}
                className={tradingMode === 'real' ? 'bg-green-600' : ''}
              >
                Real Mode
              </Button>
            </div>
            
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Wallet className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-purple-300 text-sm">
                      {tradingMode === 'real' ? 'Real Balance' : 'Demo Balance'}
                    </p>
                    <p className="text-white font-semibold">
                      ${(tradingMode === 'real' ? walletBalance.real : walletBalance.demo).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Asset Selection & Price Chart */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Select Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedAsset?.id === asset.id 
                            ? 'bg-purple-600/20 border border-purple-500/30' 
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-semibold">{asset.symbol}</h3>
                            <p className="text-purple-300 text-sm">{asset.name}</p>
                            <Badge className="mt-1 bg-green-600 text-white">
                              {asset.return_percent}% Return
                            </Badge>
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Live Price Display */}
              {selectedAsset && (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {selectedAsset.symbol}
                      </h2>
                      <div className="text-4xl font-bold text-white mb-2">
                        ${getCurrentPrice(selectedAsset.symbol).toFixed(4)}
                      </div>
                      <div className={`text-lg ${
                        getPriceChange(selectedAsset.symbol) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {getPriceChange(selectedAsset.symbol) >= 0 ? '+' : ''}
                        {getPriceChange(selectedAsset.symbol).toFixed(2)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Trading Panel */}
            <div className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Place Trade</CardTitle>
                  <CardDescription className="text-purple-300">
                    Predict price direction
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
                        <span>UP</span>
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
                        <span>DOWN</span>
                      </div>
                    </Button>
                  </div>

                  {/* Stake Amount */}
                  <div>
                    <label className="text-white text-sm">Stake Amount ($)</label>
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
                          className="border-white/20 text-purple-300 hover:bg-white/10"
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-white text-sm">Duration</label>
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
                  {selectedAsset && stakeAmount && (
                    <div className="bg-white/5 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Stake:</span>
                        <span className="text-white">${parseFloat(stakeAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Potential Profit:</span>
                        <span className="text-green-400">
                          ${((parseFloat(stakeAmount) * selectedAsset.return_percent) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Total Return:</span>
                        <span className="text-white">
                          ${(parseFloat(stakeAmount) + (parseFloat(stakeAmount) * selectedAsset.return_percent) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={placeTrade}
                    disabled={isTrading || !selectedAsset || !stakeAmount}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12"
                  >
                    {isTrading ? 'Placing Trade...' : 'Place Trade'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Active Trades & History */}
            <div className="space-y-4">
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger value="active">Active ({activeTrades.length})</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Active Trades</CardTitle>
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
                                  <span className="text-white font-medium">{trade.asset_symbol}</span>
                                </div>
                                <span className="text-white font-semibold">${trade.stake}</span>
                              </div>
                              
                              <div className="text-xs text-purple-300 space-y-1">
                                <div>Entry: ${trade.entry_price.toFixed(4)}</div>
                                <div>Time Left: {formatTime(getTimeLeft(trade.end_time))}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card className="bg-white/5 border-white/10">
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
                                  <span className="text-white font-medium">{trade.asset_symbol}</span>
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
                                <div>Entry: ${trade.entry_price.toFixed(4)} | Exit: ${(trade.exit_price || 0).toFixed(4)}</div>
                                <div>{new Date(trade.start_time).toLocaleString()}</div>
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

export default TradingPlatform;
