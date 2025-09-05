
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  Target,
  Activity,
  BarChart3,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
}

interface Position {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  timestamp: string;
}

const IntradayTrading = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate real-time stock data
    const mockStocks: Stock[] = [
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries',
        price: 2456.75,
        change: 23.45,
        changePercent: 0.96,
        volume: 1234567,
        high: 2478.90,
        low: 2432.10
      },
      {
        symbol: 'INFY',
        name: 'Infosys Limited',
        price: 1789.30,
        change: -12.85,
        changePercent: -0.71,
        volume: 987654,
        high: 1805.60,
        low: 1776.20
      },
      {
        symbol: 'HDFC',
        name: 'HDFC Bank Limited',
        price: 1623.45,
        change: 8.90,
        changePercent: 0.55,
        volume: 2345678,
        high: 1635.80,
        low: 1610.25
      },
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        price: 3421.60,
        change: -28.40,
        changePercent: -0.82,
        volume: 876543,
        high: 3458.90,
        low: 3398.75
      }
    ];

    setStocks(mockStocks);

    // Simulate some existing positions
    const mockPositions: Position[] = [
      {
        id: '1',
        symbol: 'RELIANCE',
        type: 'buy',
        quantity: 10,
        entryPrice: 2435.20,
        currentPrice: 2456.75,
        pnl: 215.50,
        pnlPercent: 0.88,
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        symbol: 'INFY',
        type: 'sell',
        quantity: 15,
        entryPrice: 1802.15,
        currentPrice: 1789.30,
        pnl: 192.75,
        pnlPercent: 1.07,
        timestamp: new Date().toISOString()
      }
    ];

    setPositions(mockPositions);

    // Simulate price updates every 5 seconds
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => ({
          ...stock,
          price: stock.price + (Math.random() - 0.5) * 10,
          change: stock.change + (Math.random() - 0.5) * 2
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleTrade = async () => {
    if (!selectedStock || !tradeAmount) {
      toast({
        title: "Invalid Trade",
        description: "Please select a stock and enter trade amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate trade execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newPosition: Position = {
        id: Date.now().toString(),
        symbol: selectedStock.symbol,
        type: tradeType,
        quantity: Math.floor(parseFloat(tradeAmount) / selectedStock.price),
        entryPrice: selectedStock.price,
        currentPrice: selectedStock.price,
        pnl: 0,
        pnlPercent: 0,
        timestamp: new Date().toISOString()
      };

      setPositions(prev => [...prev, newPosition]);
      setTradeAmount('');
      setSelectedStock(null);

      toast({
        title: "Trade Executed",
        description: `${tradeType.toUpperCase()} order for ${selectedStock.symbol} has been placed successfully`,
      });
    } catch (error) {
      toast({
        title: "Trade Failed",
        description: "Failed to execute trade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalPNL = () => {
    return positions.reduce((total, position) => total + position.pnl, 0);
  };

  const getStockChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Intraday Trading</h1>
                <p className="text-purple-300">Real-time stock trading platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-500 text-white">
                Market Open
              </Badge>
              <Button variant="outline" size="icon" className="border-white/10">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total P&L</p>
                    <p className="text-2xl font-bold">₹{getTotalPNL().toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Active Positions</p>
                    <p className="text-white text-2xl font-bold">{positions.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Available Balance</p>
                    <p className="text-white text-2xl font-bold">₹50,000</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Day's Range</p>
                    <p className="text-white text-2xl font-bold">₹408</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="market" className="space-y-4">
            <TabsList className="bg-white/5 border-white/10">
              <TabsTrigger value="market">Market Watch</TabsTrigger>
              <TabsTrigger value="positions">My Positions</TabsTrigger>
              <TabsTrigger value="orders">Order Book</TabsTrigger>
            </TabsList>

            <TabsContent value="market" className="space-y-4">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Stock List */}
                <div className="lg:col-span-2">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Live Market Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stocks.map((stock) => (
                          <div
                            key={stock.symbol}
                            onClick={() => setSelectedStock(stock)}
                            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                              selectedStock?.symbol === stock.symbol 
                                ? 'bg-purple-600/20 border border-purple-500/30' 
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-white font-semibold">{stock.symbol}</h3>
                                <p className="text-purple-300 text-sm">{stock.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-semibold">₹{stock.price.toFixed(2)}</p>
                                <p className={`text-sm ${getStockChangeColor(stock.change)}`}>
                                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                              <div>
                                <p className="text-purple-300">High</p>
                                <p className="text-white">₹{stock.high.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-purple-300">Low</p>
                                <p className="text-white">₹{stock.low.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-purple-300">Volume</p>
                                <p className="text-white">{(stock.volume / 1000).toFixed(0)}K</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trading Panel */}
                <div>
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Place Order</CardTitle>
                      <CardDescription className="text-purple-300">
                        {selectedStock ? `Trading ${selectedStock.symbol}` : 'Select a stock to trade'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedStock ? (
                        <>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-purple-300">Current Price</span>
                              <span className="text-white font-semibold">₹{selectedStock.price.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              onClick={() => setTradeType('buy')}
                              className={`flex-1 ${
                                tradeType === 'buy' 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-white/10 hover:bg-white/20'
                              }`}
                            >
                              Buy
                            </Button>
                            <Button
                              onClick={() => setTradeType('sell')}
                              className={`flex-1 ${
                                tradeType === 'sell' 
                                  ? 'bg-red-600 hover:bg-red-700' 
                                  : 'bg-white/10 hover:bg-white/20'
                              }`}
                            >
                              Sell
                            </Button>
                          </div>

                          <div>
                            <label className="text-white text-sm">Amount (₹)</label>
                            <Input
                              type="number"
                              placeholder="Enter amount"
                              value={tradeAmount}
                              onChange={(e) => setTradeAmount(e.target.value)}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            {tradeAmount && (
                              <p className="text-purple-300 text-sm mt-1">
                                Quantity: {Math.floor(parseFloat(tradeAmount) / selectedStock.price)} shares
                              </p>
                            )}
                          </div>

                          <Button 
                            onClick={handleTrade}
                            disabled={loading || !tradeAmount}
                            className={`w-full ${
                              tradeType === 'buy' 
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                            }`}
                          >
                            {loading ? 'Processing...' : `${tradeType.toUpperCase()} ${selectedStock.symbol}`}
                          </Button>

                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                              <div>
                                <p className="text-yellow-400 text-sm font-medium">Risk Warning</p>
                                <p className="text-yellow-300 text-xs">
                                  Intraday trading involves high risk. Trade responsibly.
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                          <p className="text-purple-300">Select a stock from the market watch to start trading</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="positions">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Open Positions</CardTitle>
                  <CardDescription className="text-purple-300">
                    Track your active intraday positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {positions.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-300">No open positions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {positions.map((position) => (
                        <div key={position.id} className="p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Badge className={position.type === 'buy' ? 'bg-green-600' : 'bg-red-600'}>
                                {position.type.toUpperCase()}
                              </Badge>
                              <div>
                                <h3 className="text-white font-semibold">{position.symbol}</h3>
                                <p className="text-purple-300 text-sm">Qty: {position.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)}
                              </p>
                              <p className={`text-sm ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-purple-300">Entry Price</p>
                              <p className="text-white">₹{position.entryPrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-purple-300">Current Price</p>
                              <p className="text-white">₹{position.currentPrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-purple-300">Time</p>
                              <p className="text-white">{new Date(position.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 mt-4">
                            <Button variant="outline" size="sm" className="border-white/10 text-red-400">
                              Close Position
                            </Button>
                            <Button variant="outline" size="sm" className="border-white/10">
                              Modify
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Order History</CardTitle>
                  <CardDescription className="text-purple-300">
                    View your recent trading orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-300">No orders found for today</p>
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
};

export default IntradayTrading;
