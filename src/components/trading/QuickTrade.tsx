import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Clock, DollarSign, Activity, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const assets = [
  { id: 'BTCUSD', name: 'Bitcoin/USD', type: 'crypto', payout: 95 },
  { id: 'ETHUSD', name: 'Ethereum/USD', type: 'crypto', payout: 92 },
  { id: 'EURUSD', name: 'EUR/USD', type: 'forex', payout: 85 },
  { id: 'GBPUSD', name: 'GBP/USD', type: 'forex', payout: 85 },
  { id: 'GOLD', name: 'Gold', type: 'commodity', payout: 88 },
  { id: 'AAPL', name: 'Apple', type: 'stock', payout: 82 },
];

const durations = [
  { value: '60', label: '1 Min', seconds: 60 },
  { value: '300', label: '5 Min', seconds: 300 },
  { value: '900', label: '15 Min', seconds: 900 },
  { value: '3600', label: '1 Hour', seconds: 3600 },
  { value: '14400', label: '4 Hours', seconds: 14400 },
  { value: '86400', label: '1 Day', seconds: 86400 },
];

export function QuickTrade() {
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [duration, setDuration] = useState('60');
  const [amount, setAmount] = useState('10');
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentPrice, setCurrentPrice] = useState(42567.89);
  const [priceChange, setPriceChange] = useState(0);
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate price movement
      const change = (Math.random() - 0.5) * 100;
      setCurrentPrice(prev => prev + change);
      setPriceChange(change);
      
      // Update countdown
      setTimeLeft(prev => prev > 0 ? prev - 1 : 60);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTrade = (type: 'CALL' | 'PUT') => {
    const payout = (parseFloat(amount) * selectedAsset.payout / 100).toFixed(2);
    const trade = {
      id: Date.now(),
      asset: selectedAsset.name,
      type,
      amount: parseFloat(amount),
      payout: parseFloat(payout),
      entryPrice: currentPrice,
      duration: durations.find(d => d.value === duration)?.label,
      timestamp: new Date(),
    };

    setActiveTrades([...activeTrades, trade]);

    toast({
      title: `${type} Trade Placed!`,
      description: `${selectedAsset.name} - $${amount} | Potential payout: $${payout}`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Trading Panel */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6 bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20">
          <div className="space-y-6">
            {/* Asset Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Select Asset</label>
                <Select value={selectedAsset.id} onValueChange={(value) => setSelectedAsset(assets.find(a => a.id === value) || assets[0])}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{asset.name}</span>
                          <span className="text-xs text-muted-foreground">{asset.payout}%</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Duration</label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map(dur => (
                      <SelectItem key={dur.value} value={dur.value}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Display */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold">{selectedAsset.name}</div>
                  <div className="text-sm text-muted-foreground">Current Price</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    ${currentPrice.toFixed(2)}
                  </div>
                  <div className={`text-sm flex items-center justify-end ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {priceChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {Math.abs(priceChange).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Live Chart Placeholder */}
              <div className="h-32 bg-background/50 rounded-lg flex items-center justify-center">
                <Activity className="w-8 h-8 text-muted-foreground animate-pulse" />
              </div>
            </div>

            {/* Investment Amount */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Investment Amount</label>
              <div className="grid grid-cols-5 gap-2">
                {['10', '25', '50', '100', '250'].map(value => (
                  <Button
                    key={value}
                    variant={amount === value ? 'default' : 'outline'}
                    onClick={() => setAmount(value)}
                    className="w-full"
                  >
                    ${value}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 bg-background/50"
                placeholder="Custom amount"
              />
            </div>

            {/* Payout Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Investment</div>
                <div className="text-xl font-bold">${amount}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Potential Payout</div>
                <div className="text-xl font-bold text-green-500">
                  ${(parseFloat(amount) * (1 + selectedAsset.payout / 100)).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Trade Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleTrade('CALL')}
                className="h-16 text-lg font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
              >
                <TrendingUp className="w-6 h-6 mr-2" />
                CALL (UP)
              </Button>
              <Button
                onClick={() => handleTrade('PUT')}
                className="h-16 text-lg font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
              >
                <TrendingDown className="w-6 h-6 mr-2" />
                PUT (DOWN)
              </Button>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              <span className="text-lg font-semibold">
                Next Trade Closes In: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Trades */}
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-primary" />
            Active Trades
          </h3>
          
          <div className="space-y-3">
            {activeTrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active trades
              </div>
            ) : (
              activeTrades.slice(-5).reverse().map(trade => (
                <div key={trade.id} className="p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{trade.asset}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      trade.type === 'CALL' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {trade.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="ml-1 font-medium">${trade.amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payout:</span>
                      <span className="ml-1 font-medium text-green-500">${trade.payout}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {trade.duration} • ${trade.entryPrice.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Market Stats */}
        <Card className="p-6 bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary" />
            Market Stats
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-bold text-green-500">68.5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Today's Trades</span>
              <span className="font-bold">24</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Profit</span>
              <span className="font-bold text-green-500">+$1,234.56</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Market Trend</span>
              <span className="font-bold text-green-500">Bullish</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}