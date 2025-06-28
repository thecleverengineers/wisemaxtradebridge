import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  LineChart,
  BarChart,
  PieChart,
  ListChecks,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useWalletBalance } from '@/hooks/useWalletBalance';

interface TradingInstrument {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
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
  timestamp: string;
  status: 'open' | 'closed';
}

const mockInstruments: TradingInstrument[] = [
  {
    symbol: 'EURUSD',
    name: 'Euro vs US Dollar',
    price: 1.1025,
    change: 0.0005,
    changePercent: 0.045,
    spread: 0.0002
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound vs US Dollar',
    price: 1.2850,
    change: -0.0010,
    changePercent: -0.078,
    spread: 0.0003
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar vs Japanese Yen',
    price: 147.50,
    change: 0.25,
    changePercent: 0.17,
    spread: 0.02
  },
  {
    symbol: 'GOLD',
    name: 'Gold Spot',
    price: 2025.50,
    change: 5.20,
    changePercent: 0.26,
    spread: 0.50
  },
  {
    symbol: 'OIL',
    name: 'Crude Oil',
    price: 75.20,
    change: -0.30,
    changePercent: -0.40,
    spread: 0.10
  }
];

const MT5Trading = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [instruments, setInstruments] = useState<TradingInstrument[]>(mockInstruments);
  const [selectedInstrument, setSelectedInstrument] = useState<TradingInstrument | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [executing, setExecuting] = useState(false);
  const { walletData, checkBalance, deductBalance } = useWalletBalance();

  useEffect(() => {
    // Simulate real-time price updates
    const interval = setInterval(() => {
      setInstruments(prevInstruments => 
        prevInstruments.map(instrument => ({
          ...instrument,
          price: instrument.price + (Math.random() - 0.5) * 0.5,
          change: instrument.change + (Math.random() - 0.5) * 0.1
        }))
      );
    }, 3000);

    // Simulate some existing positions
    const initialPositions: Position[] = [
      {
        id: 'pos_1',
        symbol: 'EURUSD',
        type: 'buy',
        volume: 0.50,
        openPrice: 1.1020,
        currentPrice: 1.1025,
        pnl: 25.00,
        timestamp: new Date().toISOString(),
        status: 'open'
      },
      {
        id: 'pos_2',
        symbol: 'GOLD',
        type: 'sell',
        volume: 0.20,
        openPrice: 2030.00,
        currentPrice: 2025.50,
        pnl: -90.00,
        timestamp: new Date().toISOString(),
        status: 'open'
      }
    ];
    setPositions(initialPositions);

    return () => clearInterval(interval);
  }, []);

  const executeTrade = async () => {
    if (!selectedInstrument || !tradeAmount) {
      toast({
        title: "Invalid Trade",
        description: "Please select an instrument and enter trade amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(tradeAmount);
    
    // Check wallet balance before executing trade
    if (!checkBalance(amount)) {
      return;
    }

    setExecuting(true);
    try {
      // Deduct balance from wallet
      const success = await deductBalance(
        amount,
        `MT5 ${tradeType.toUpperCase()} ${selectedInstrument.symbol} - ₹${amount.toLocaleString()}`,
        `mt5_${Date.now()}`
      );

      if (!success) {
        setExecuting(false);
        return;
      }

      // Simulate trade execution
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newPosition: Position = {
        id: `pos_${Date.now()}`,
        symbol: selectedInstrument.symbol,
        type: tradeType,
        volume: parseFloat((amount / selectedInstrument.price).toFixed(2)),
        openPrice: selectedInstrument.price,
        currentPrice: selectedInstrument.price,
        pnl: 0,
        timestamp: new Date().toISOString(),
        status: 'open'
      };

      setPositions(prev => [...prev, newPosition]);
      setTradeAmount('');
      
      toast({
        title: "Trade Executed",
        description: `${tradeType.toUpperCase()} position opened for ${selectedInstrument.symbol}`,
      });
    } catch (error) {
      console.error('Trade execution error:', error);
      toast({
        title: "Trade Failed",
        description: "Failed to execute trade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  const closePosition = (positionId: string) => {
    setPositions(prev => 
      prev.map(pos => 
        pos.id === positionId ? { ...pos, status: 'closed' } : pos
      )
    );
  };

  const calculateTotalPnl = () => {
    return positions.reduce((total, position) => {
      if (position.status === 'open') {
        return total + (position.type === 'buy' 
          ? (position.currentPrice - position.openPrice) * position.volume
          : (position.openPrice - position.currentPrice) * position.volume);
      } else {
        return total;
      }
    }, 0);
  };

  const getPositionPnl = (position: Position) => {
    return position.type === 'buy' 
      ? (position.currentPrice - position.openPrice) * position.volume
      : (position.openPrice - position.currentPrice) * position.volume;
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
                <h1 className="text-2xl font-bold text-white">MT5 Trading Platform</h1>
                <p className="text-purple-300">Trade Forex, Commodities, and more</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-500 text-white">
                Market Open
              </Badge>
            </div>
          </div>

          {/* Account Summary with Wallet Balance */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Available Balance</p>
                    <p className="text-xl font-bold">₹{walletData?.total_balance.toLocaleString() || '0'}</p>
                  </div>
                  <Wallet className="h-6 w-6 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Total P&L</p>
                    <p className="text-white text-xl font-bold">₹{calculateTotalPnl().toFixed(2)}</p>
                  </div>
                  <LineChart className="h-6 w-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Open Positions</p>
                    <p className="text-white text-xl font-bold">{positions.filter(p => p.status === 'open').length}</p>
                  </div>
                  <BarChart className="h-6 w-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Equity</p>
                    <p className="text-white text-xl font-bold">₹{(walletData?.total_balance || 0 + calculateTotalPnl()).toFixed(2)}</p>
                  </div>
                  <PieChart className="h-6 w-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Margin Used</p>
                    <p className="text-white text-xl font-bold">₹0.00</p>
                  </div>
                  <ListChecks className="h-6 w-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Instrument List */}
            <div className="lg:col-span-2">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Select Instrument</CardTitle>
                  <CardDescription className="text-purple-300">
                    Choose an instrument to trade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {instruments.map((instrument) => (
                    <div
                      key={instrument.symbol}
                      onClick={() => setSelectedInstrument(instrument)}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedInstrument?.symbol === instrument.symbol
                          ? 'bg-purple-600/20 border border-purple-500/30'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold">{instrument.symbol}</h3>
                          <p className="text-purple-300 text-sm">{instrument.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{instrument.price.toFixed(4)}</p>
                          <p className={`text-sm ${instrument.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {instrument.change >= 0 ? '+' : ''}{instrument.change.toFixed(4)} ({instrument.changePercent.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                      <div className="text-sm mt-2">
                        <span className="text-purple-300">Spread:</span>
                        <span className="text-white"> {instrument.spread.toFixed(5)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Trading Panel */}
            <div>
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Trade Panel</CardTitle>
                  <CardDescription className="text-purple-300">
                    Execute your trades here
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedInstrument ? (
                    <>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-300">Current Price</span>
                          <span className="text-white font-semibold">{selectedInstrument.price.toFixed(4)}</span>
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
                        <Label className="text-white text-sm">Amount (₹)</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={tradeAmount}
                          onChange={(e) => setTradeAmount(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <Button
                        onClick={executeTrade}
                        disabled={executing || !tradeAmount}
                        className={`w-full ${
                          tradeType === 'buy'
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                        }`}
                      >
                        {executing ? 'Executing...' : `${tradeType.toUpperCase()} ${selectedInstrument.symbol}`}
                      </Button>

                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                          <div>
                            <p className="text-yellow-400 text-sm font-medium">Risk Warning</p>
                            <p className="text-yellow-300 text-xs">
                              Trading involves substantial risk of loss. Trade responsibly.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-300">Select an instrument to start trading</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Open Positions */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Open Positions</CardTitle>
              <CardDescription className="text-purple-300">
                Manage your active positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {positions.filter(p => p.status === 'open').length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-purple-300">No open positions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {positions.filter(p => p.status === 'open').map((position) => (
                    <div key={position.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold">{position.symbol}</h3>
                          <p className="text-purple-300 text-sm">
                            {position.type.toUpperCase()} - {position.volume} lots
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${getPositionPnl(position) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            P&L: ₹{getPositionPnl(position).toFixed(2)}
                          </p>
                          <Button variant="outline" size="sm" onClick={() => closePosition(position.id)} className="border-white/10 text-red-400 mt-2">
                            Close Position
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                        <div>
                          <p className="text-purple-300">Open Price</p>
                          <p className="text-white">{position.openPrice.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-purple-300">Current Price</p>
                          <p className="text-white">{position.currentPrice.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-purple-300">Time</p>
                          <p className="text-white">{new Date(position.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MT5Trading;
