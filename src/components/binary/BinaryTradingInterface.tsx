import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BinaryTradingInterfaceProps {
  balance: number;
  onTradePlace: () => void;
}

export function BinaryTradingInterface({ balance, onTradePlace }: BinaryTradingInterfaceProps) {
  const { user } = useAuth();
  const [assetPair, setAssetPair] = useState('EUR/USD');
  const [stakeAmount, setStakeAmount] = useState('1');
  const [expiryTime, setExpiryTime] = useState('1');
  const [loading, setLoading] = useState(false);

  const placeTrade = async (tradeType: 'CALL' | 'PUT') => {
    if (!user) {
      toast.error('Please login to place trades');
      return;
    }

    const stake = parseFloat(stakeAmount);
    if (isNaN(stake) || stake <= 0) {
      toast.error('Please enter a valid stake amount');
      return;
    }

    if (stake > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      // Get current price (simulated - in production this would come from a real data feed)
      const currentPrice = 1.0800 + (Math.random() * 0.02);
      const expiryMinutes = parseInt(expiryTime);
      const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);
      
      // Place trade using RPC function
      const { data: tradeResult, error: tradeError } = await supabase.rpc('place_binary_trade', {
        p_asset: assetPair,
        p_direction: tradeType,
        p_amount: stake,
        p_entry_price: currentPrice,
        p_duration: expiryMinutes
      });

      if (tradeError) throw tradeError;

      toast.success(`${tradeType} trade placed successfully!`);
      onTradePlace();
    } catch (error: any) {
      toast.error(error.message || 'Failed to place trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle>Place Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Asset Pair Selection */}
        <div>
          <label className="text-sm text-muted-foreground">Asset Pair</label>
          <Select value={assetPair} onValueChange={setAssetPair}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR/USD">EUR/USD</SelectItem>
              <SelectItem value="GBP/USD">GBP/USD</SelectItem>
              <SelectItem value="USD/JPY">USD/JPY</SelectItem>
              <SelectItem value="AUD/USD">AUD/USD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stake Amount */}
        <div>
          <label className="text-sm text-muted-foreground">Stake Amount (USDT)</label>
          <Input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Enter stake amount"
            min="1"
            max={balance.toString()}
            className="w-full"
          />
          <div className="flex gap-2 mt-2">
            {[10, 25, 50, 100].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setStakeAmount(amount.toString())}
                className="flex-1"
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Expiry Time */}
        <div>
          <label className="text-sm text-muted-foreground">Expiry Time</label>
          <Select value={expiryTime} onValueChange={setExpiryTime}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Minute</SelectItem>
              <SelectItem value="5">5 Minutes</SelectItem>
              <SelectItem value="15">15 Minutes</SelectItem>
              <SelectItem value="30">30 Minutes</SelectItem>
              <SelectItem value="60">1 Hour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Potential Payout */}
        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground">Potential Payout (80% return)</p>
          <p className="text-2xl font-bold text-primary">
            ${(parseFloat(stakeAmount) * 1.8 || 0).toFixed(2)}
          </p>
        </div>

        {/* Trade Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => placeTrade('CALL')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            CALL (UP)
          </Button>
          <Button
            onClick={() => placeTrade('PUT')}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            <TrendingDown className="mr-2 h-5 w-5" />
            PUT (DOWN)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}