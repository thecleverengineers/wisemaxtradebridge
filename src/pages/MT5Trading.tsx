
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  Activity, 
  DollarSign,
  Clock,
  Target,
  Calendar,
  Settings,
  Bot,
  Globe,
  Smartphone,
  Shield,
  Zap,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Calculator,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  bid: number;
  ask: number;
  spread: number;
}

interface Position {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  openTime: string;
}

interface Order {
  id: string;
  symbol: string;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  volume: number;
  price?: number;
  stopPrice?: number;
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: string;
}

interface EconomicEvent {
  time: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string;
  previous: string;
}

const MT5Trading = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('market');
  
  // Market data
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [isMarketOpen, setIsMarketOpen] = useState(true);
  
  // Trading
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderVolume, setOrderVolume] = useState('0.01');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop' | 'stop_limit'>('market');
  const [orderPrice, setOrderPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  
  // Account info
  const [accountBalance, setAccountBalance] = useState(10000);
  const [accountEquity, setAccountEquity] = useState(10000);
  const [margin, setMargin] = useState(0);
  const [freeMargin, setFreeMargin] = useState(10000);
  
  // Expert Advisors
  const [experts, setExperts] = useState([
    { id: '1', name: 'Scalping Pro', status: 'running', profit: 245.50 },
    { id: '2', name: 'Trend Follower', status: 'stopped', profit: -89.25 },
    { id: '3', name: 'Grid Master', status: 'running', profit: 567.80 },
  ]);
  
  // Economic Calendar
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([
    { time: '09:30', currency: 'USD', event: 'Non-Farm Payrolls', impact: 'high', forecast: '200K', previous: '195K' },
    { time: '10:00', currency: 'EUR', event: 'CPI Flash Estimate', impact: 'high', forecast: '2.4%', previous: '2.2%' },
    { time: '14:00', currency: 'GBP', event: 'GDP Growth Rate', impact: 'medium', forecast: '0.2%', previous: '0.1%' },
    { time: '15:30', currency: 'JPY', event: 'Industrial Production', impact: 'low', forecast: '0.5%', previous: '0.3%' },
  ]);

  // Initialize market data
  useEffect(() => {
    const initialMarketData: MarketData[] = [
      { symbol: 'EURUSD', name: 'Euro/US Dollar', price: 1.0945, change: 0.0012, changePercent: 0.11, volume: 125000, high: 1.0967, low: 1.0920, bid: 1.0943, ask: 1.0945, spread: 0.0002 },
      { symbol: 'GBPUSD', name: 'British Pound/US Dollar', price: 1.2678, change: -0.0023, changePercent: -0.18, volume: 98000, high: 1.2705, low: 1.2651, bid: 1.2676, ask: 1.2678, spread: 0.0002 },
      { symbol: 'USDJPY', name: 'US Dollar/Japanese Yen', price: 149.85, change: 0.45, changePercent: 0.30, volume: 87000, high: 150.12, low: 149.23, bid: 149.83, ask: 149.85, spread: 0.02 },
      { symbol: 'AUDUSD', name: 'Australian Dollar/US Dollar', price: 0.6542, change: 0.0008, changePercent: 0.12, volume: 65000, high: 0.6558, low: 0.6521, bid: 0.6540, ask: 0.6542, spread: 0.0002 },
      { symbol: 'USDCAD', name: 'US Dollar/Canadian Dollar', price: 1.3687, change: -0.0015, changePercent: -0.11, volume: 54000, high: 1.3712, low: 1.3675, bid: 1.3685, ask: 1.3687, spread: 0.0002 },
      { symbol: 'XAUUSD', name: 'Gold/US Dollar', price: 2087.45, change: 12.30, changePercent: 0.59, volume: 45000, high: 2092.80, low: 2071.20, bid: 2086.50, ask: 2087.45, spread: 0.95 },
    ];
    setMarketData(initialMarketData);

    // Simulate real-time price updates
    const interval = setInterval(() => {
      setMarketData(prevData => 
        prevData.map(item => ({
          ...item,
          price: item.price + (Math.random() - 0.5) * 0.001 * item.price,
          change: item.change + (Math.random() - 0.5) * 0.0005,
          changePercent: ((item.price + (Math.random() - 0.5) * 0.001 * item.price) / item.price - 1) * 100,
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Place order function
  const placeOrder = (side: 'buy' | 'sell') => {
    const selectedMarket = marketData.find(m => m.symbol === selectedSymbol);
    if (!selectedMarket) return;

    const newOrder: Order = {
      id: Date.now().toString(),
      symbol: selectedSymbol,
      type: orderType,
      side,
      volume: parseFloat(orderVolume),
      price: orderType === 'market' ? undefined : parseFloat(orderPrice),
      status: orderType === 'market' ? 'filled' : 'pending',
      createdAt: new Date().toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);

    // If market order, create position immediately
    if (orderType === 'market') {
      const newPosition: Position = {
        id: Date.now().toString(),
        symbol: selectedSymbol,
        type: side,
        volume: parseFloat(orderVolume),
        openPrice: side === 'buy' ? selectedMarket.ask : selectedMarket.bid,
        currentPrice: selectedMarket.price,
        pnl: 0,
        pnlPercent: 0,
        openTime: new Date().toISOString(),
      };
      setPositions(prev => [newPosition, ...prev]);
    }

    toast({
      title: "Order Placed",
      description: `${side.toUpperCase()} ${orderVolume} ${selectedSymbol} order placed successfully`,
    });
  };

  const closePosition = (positionId: string) => {
    setPositions(prev => prev.filter(p => p.id !== positionId));
    toast({
      title: "Position Closed",
      description: "Position closed successfully",
    });
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
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
                <h1 className="text-2xl font-bold text-white">MetaTrader 5</h1>
                <p className="text-purple-300">Professional Multi-Asset Trading Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${isMarketOpen ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                {isMarketOpen ? 'Market Open' : 'Market Closed'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMarketOpen(!isMarketOpen)}
                className="text-white border-white/20"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Account Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-purple-300 text-sm">Balance</p>
                    <p className="text-white font-semibold">${accountBalance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-purple-300 text-sm">Equity</p>
                    <p className="text-white font-semibold">${accountEquity.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-purple-300 text-sm">Margin</p>
                    <p className="text-white font-semibold">${margin.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-purple-300 text-sm">Free Margin</p>
                    <p className="text-white font-semibold">${freeMargin.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Trading Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6 bg-white/10">
              <TabsTrigger value="market">Market Watch</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="experts">Expert Advisors</TabsTrigger>
            </TabsList>

            {/* Market Watch */}
            <TabsContent value="market">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Market Watch - 38 Technical Indicators
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    Real-time quotes for Forex, Stocks, Commodities & Crypto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {marketData.map((market) => (
                      <div 
                        key={market.symbol}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedSymbol === market.symbol 
                            ? 'bg-purple-600/20 border-purple-500' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedSymbol(market.symbol)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-semibold">{market.symbol}</h4>
                            <p className="text-purple-300 text-sm">{market.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{market.price.toFixed(market.symbol.includes('JPY') ? 3 : 5)}</p>
                            <div className="flex items-center space-x-1">
                              {market.change >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-400" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-400" />
                              )}
                              <span className={`text-sm ${market.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {market.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-sm text-purple-300">
                            <p>Bid: {market.bid.toFixed(market.symbol.includes('JPY') ? 3 : 5)}</p>
                            <p>Ask: {market.ask.toFixed(market.symbol.includes('JPY') ? 3 : 5)}</p>
                            <p>Spread: {market.spread.toFixed(market.symbol.includes('JPY') ? 2 : 5)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trading */}
            <TabsContent value="trading">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Order Entry - 6 Order Types</CardTitle>
                    <CardDescription className="text-purple-300">
                      Market, Limit, Stop, Stop Limit Orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Symbol</Label>
                      <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {marketData.map((market) => (
                            <SelectItem key={market.symbol} value={market.symbol}>
                              {market.symbol} - {market.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white">Order Type</Label>
                      <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="market">Market Order</SelectItem>
                          <SelectItem value="limit">Limit Order</SelectItem>
                          <SelectItem value="stop">Stop Order</SelectItem>
                          <SelectItem value="stop_limit">Stop Limit Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white">Volume (Lots)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={orderVolume}
                        onChange={(e) => setOrderVolume(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    {orderType !== 'market' && (
                      <div>
                        <Label className="text-white">Price</Label>
                        <Input
                          type="number"
                          step="0.00001"
                          value={orderPrice}
                          onChange={(e) => setOrderPrice(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Stop Loss</Label>
                        <Input
                          type="number"
                          step="0.00001"
                          value={stopLoss}
                          onChange={(e) => setStopLoss(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Take Profit</Label>
                        <Input
                          type="number"
                          step="0.00001"
                          value={takeProfit}
                          onChange={(e) => setTakeProfit(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => placeOrder('buy')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={!isMarketOpen}
                      >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        BUY
                      </Button>
                      <Button
                        onClick={() => placeOrder('sell')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={!isMarketOpen}
                      >
                        <ArrowDownLeft className="h-4 w-4 mr-2" />
                        SELL
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Market Depth (DOM)</CardTitle>
                    <CardDescription className="text-purple-300">
                      Level II Order Book - Real-time Liquidity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-4 text-purple-300 text-sm font-semibold">
                        <div>Volume</div>
                        <div>Bid</div>
                        <div>Ask</div>
                      </div>
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-red-400">{(Math.random() * 100).toFixed(2)}</div>
                          <div className="text-white">{(1.0943 - i * 0.0001).toFixed(5)}</div>
                          <div className="text-white">{(1.0945 + i * 0.0001).toFixed(5)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Positions */}
            <TabsContent value="positions">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Open Positions</CardTitle>
                  <CardDescription className="text-purple-300">
                    Manage your active trades with real-time P&L
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {positions.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-300">No open positions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {positions.map((position) => (
                        <div key={position.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-semibold">{position.symbol}</h4>
                              <p className="text-purple-300 text-sm">
                                {position.type.toUpperCase()} {position.volume} lots
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-white">Open: {position.openPrice.toFixed(5)}</p>
                              <p className="text-purple-300 text-sm">Current: {position.currentPrice.toFixed(5)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${position.pnl.toFixed(2)}
                              </p>
                              <p className={`text-sm ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {position.pnlPercent.toFixed(2)}%
                              </p>
                            </div>
                            <Button
                              onClick={() => closePosition(position.id)}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders */}
            <TabsContent value="orders">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Pending Orders</CardTitle>
                  <CardDescription className="text-purple-300">
                    Track and manage your pending orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-300">No pending orders</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-semibold">{order.symbol}</h4>
                              <p className="text-purple-300 text-sm">
                                {order.type.toUpperCase()} {order.side.toUpperCase()} {order.volume} lots
                              </p>
                            </div>
                            <div className="text-right">
                              {order.price && (
                                <p className="text-white">Price: {order.price.toFixed(5)}</p>
                              )}
                              <p className="text-purple-300 text-sm">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <Badge className={`${
                              order.status === 'filled' ? 'bg-green-500' : 
                              order.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            } text-white`}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Economic Calendar */}
            <TabsContent value="calendar">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Economic Calendar
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    Real-time economic events and fundamental analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {economicEvents.map((event, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-white font-semibold">{event.time}</div>
                            <Badge className="bg-blue-500 text-white">{event.currency}</Badge>
                            <div className={`w-3 h-3 rounded-full ${getImpactColor(event.impact)}`}></div>
                            <div>
                              <h4 className="text-white font-semibold">{event.event}</h4>
                              <p className="text-purple-300 text-sm">Impact: {event.impact}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white">Forecast: {event.forecast}</p>
                            <p className="text-purple-300 text-sm">Previous: {event.previous}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expert Advisors */}
            <TabsContent value="experts">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Bot className="h-5 w-5 mr-2" />
                    Expert Advisors (EAs) - MQL5 Bots
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    Automated trading systems with multi-threaded backtesting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {experts.map((expert) => (
                      <div key={expert.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              expert.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <div>
                              <h4 className="text-white font-semibold">{expert.name}</h4>
                              <p className="text-purple-300 text-sm">Status: {expert.status}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className={`font-semibold ${expert.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${expert.profit.toFixed(2)}
                              </p>
                              <p className="text-purple-300 text-sm">Total P&L</p>
                            </div>
                            <Button
                              size="sm"
                              className={expert.status === 'running' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                            >
                              {expert.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Platform Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">21 Timeframes</h3>
                <p className="text-sm text-blue-100">M1 to MN1 analysis</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
              <CardContent className="p-4 text-center">
                <Globe className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">Multi-Asset</h3>
                <p className="text-sm text-green-100">Forex, Stocks, Crypto</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-600 to-red-600 border-0 text-white">
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">Fast Execution</h3>
                <p className="text-sm text-orange-100">Low latency trading</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white">
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">Secure & Safe</h3>
                <p className="text-sm text-purple-100">128-bit encryption</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MT5Trading;
