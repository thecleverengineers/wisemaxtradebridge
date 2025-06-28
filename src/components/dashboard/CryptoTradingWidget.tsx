import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useWalletBalance } from '@/hooks/useWalletBalance';

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
}

interface Order {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  amount: number;
  price: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  timestamp: string;
}

const mockCryptoPrices: CryptoPrice[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 67845.32,
    change24h: 1250.45,
    changePercent24h: 1.88,
    volume24h: 28456789000,
    marketCap: 1340000000000,
    high24h: 68200.00,
    low24h: 66500.00
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3456.78,
    change24h: -45.23,
    changePercent24h: -1.29,
    volume24h: 15234567000,
    marketCap: 415000000000,
    high24h: 3520.00,
    low24h: 3400.00
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    price: 628.45,
    change24h: 12.34,
    changePercent24h: 2.00,
    volume24h: 1234567000,
    marketCap: 94000000000,
    high24h: 635.00,
    low24h: 615.00
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.4567,
    change24h: 0.0234,
    changePercent24h: 5.40,
    volume24h: 567890000,
    marketCap: 16000000000,
    high24h: 0.4650,
    low24h: 0.4400
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 156.78,
    change24h: -3.45,
    changePercent24h: -2.15,
    volume24h: 2345678000,
    marketCap: 68000000000,
    high24h: 162.00,
    low24h: 154.00
  }
];

export const CryptoTradingWidget = () => {
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>(mockCryptoPrices);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoPrice>(mockCryptoPrices[0]);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeType, setTradeType] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS'>('MARKET');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const { walletData, checkBalance, deductBalance } = useWalletBalance();

  useEffect(() => {
    // Simulate real-time price updates
    const interval = setInterval(() => {
      setCryptoPrices(prev => prev.map(crypto => ({
        ...crypto,
        price: crypto.price + (Math.random() - 0.5) * crypto.price * 0.01,
        change24h: (Math.random() - 0.5) * crypto.price * 0.05,
        changePercent24h: (Math.random() - 0.5) * 5
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleTrade = async () => {
    if (!amount || (tradeType !== 'MARKET' && !price)) return;

    const tradeAmount = parseFloat(amount);
    const tradePrice = tradeType === 'MARKET' ? selectedCrypto.price : parseFloat(price);
    const totalCost = tradeAmount * tradePrice;

    // Check wallet balance before executing trade
    if (!checkBalance(totalCost)) {
      return;
    }

    // Deduct balance from wallet
    const success = await deductBalance(
      totalCost,
      `${orderType} ${tradeAmount} ${selectedCrypto.symbol} at ₹${tradePrice.toFixed(2)}`,
      Math.random().toString(36).substr(2, 9)
    );

    if (!success) {
      return;
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedCrypto.symbol,
      type: orderType,
      orderType: tradeType,
      amount: tradeAmount,
      price: tradePrice,
      status: tradeType === 'MARKET' ? 'FILLED' : 'PENDING',
      timestamp: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    setAmount('');
    setPrice('');
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Display */}
      {walletData && (
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8" />
                <div>
                  <p className="text-green-100">Available Balance</p>
                  <p className="text-2xl font-bold">₹{walletData.total_balance.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crypto Price List */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Crypto Markets
            </CardTitle>
            <CardDescription className="text-purple-300">
              Real-time cryptocurrency prices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cryptoPrices.map((crypto) => (
                <div 
                  key={crypto.symbol}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCrypto.symbol === crypto.symbol 
                      ? 'bg-purple-600/20 border border-purple-500/30' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedCrypto(crypto)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${
                      crypto.symbol === 'BTC' ? 'from-orange-500 to-yellow-500' :
                      crypto.symbol === 'ETH' ? 'from-blue-500 to-purple-500' :
                      crypto.symbol === 'BNB' ? 'from-yellow-500 to-orange-500' :
                      crypto.symbol === 'ADA' ? 'from-blue-500 to-teal-500' :
                      'from-purple-500 to-pink-500'
                    } flex items-center justify-center`}>
                      <span className="text-white font-bold text-xs">{crypto.symbol[0]}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{crypto.symbol}</h4>
                      <p className="text-purple-300 text-sm">{crypto.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: crypto.price < 1 ? 4 : 2 })}
                    </p>
                    <p className={`text-sm ${crypto.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {crypto.changePercent24h >= 0 ? '+' : ''}{crypto.changePercent24h.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trading Panel */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Trade
            </CardTitle>
            <CardDescription className="text-purple-300">
              {selectedCrypto.name} (${selectedCrypto.price.toLocaleString()})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={orderType} onValueChange={(value) => setOrderType(value as 'BUY' | 'SELL')}>
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="BUY" className="data-[state=active]:bg-green-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  BUY
                </TabsTrigger>
                <TabsTrigger value="SELL" className="data-[state=active]:bg-red-600">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  SELL
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={tradeType} onValueChange={(value) => setTradeType(value as 'MARKET' | 'LIMIT' | 'STOP_LOSS')}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                <SelectItem value="MARKET">Market Order</SelectItem>
                <SelectItem value="LIMIT">Limit Order</SelectItem>
                <SelectItem value="STOP_LOSS">Stop Loss</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-3">
              <div>
                <label className="text-purple-300 text-sm">Amount ({selectedCrypto.symbol})</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {tradeType !== 'MARKET' && (
                <div>
                  <label className="text-purple-300 text-sm">Price (USD)</label>
                  <Input
                    type="number"
                    placeholder={selectedCrypto.price.toString()}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}

              {amount && (
                <div className="bg-white/5 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">Total:</span>
                    <span className="text-white">
                      ${((parseFloat(amount) || 0) * (tradeType === 'MARKET' ? selectedCrypto.price : parseFloat(price) || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">Fee (0.1%):</span>
                    <span className="text-white">
                      ${(((parseFloat(amount) || 0) * (tradeType === 'MARKET' ? selectedCrypto.price : parseFloat(price) || 0)) * 0.001).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Button 
              onClick={handleTrade}
              disabled={!amount || (tradeType !== 'MARKET' && !price)}
              className={`w-full ${
                orderType === 'BUY' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
              }`}
            >
              {orderType} {selectedCrypto.symbol}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      {orders.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={order.type === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                      {order.type}
                    </Badge>
                    <div>
                      <p className="text-white font-medium">{order.symbol}</p>
                      <p className="text-purple-300 text-sm">{order.orderType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{order.amount} @ ${order.price.toLocaleString()}</p>
                    <Badge variant="outline" className={
                      order.status === 'FILLED' ? 'border-green-500 text-green-400' :
                      order.status === 'PENDING' ? 'border-yellow-500 text-yellow-400' :
                      'border-red-500 text-red-400'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
