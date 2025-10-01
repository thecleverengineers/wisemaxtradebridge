import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TradePanelProps {
  balance: number;
  onTradeComplete: () => void;
}

export const TradePanel: React.FC<TradePanelProps> = ({ balance, onTradeComplete }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const placeTrade = async (signalType: 'CALL' | 'PUT') => {
    if (!user) {
      toast.error('Please login to place trades');
      return;
    }

    const tradeAmount = parseFloat(amount);
    
    if (!tradeAmount || tradeAmount <= 0) {
      toast.error('Please enter a valid trade amount');
      return;
    }

    if (tradeAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('place-trade', {
        body: { signalType, amount: tradeAmount },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      if (data.result === 'WIN') {
        toast.success(`🎉 Trade WON! +$${tradeAmount.toFixed(2)}`);
      } else {
        toast.error(`Trade lost. -$${tradeAmount.toFixed(2)}`);
      }

      setAmount('');
      onTradeComplete();
    } catch (error: any) {
      console.error('Trade error:', error);
      toast.error(error.message || 'Failed to place trade');
    } finally {
      setProcessing(false);
    }
  };

  const quickAmounts = [10, 25, 50, 100];

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle>Place Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {balance < 10 && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              Low balance. Minimum trade amount is $10.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="amount">Trade Amount (USD)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max={balance}
            step="0.01"
            disabled={processing}
          />
          <div className="flex gap-2 mt-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                size="sm"
                variant="outline"
                onClick={() => setAmount(quickAmount.toString())}
                disabled={processing || balance < quickAmount}
              >
                ${quickAmount}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => placeTrade('CALL')}
            disabled={processing || !amount || parseFloat(amount) <= 0}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            CALL (Buy)
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => placeTrade('PUT')}
            disabled={processing || !amount || parseFloat(amount) <= 0}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            PUT (Sell)
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Current Balance: ${balance.toFixed(2)}</p>
          <p className="mt-1">Win rate: 2x payout</p>
        </div>
      </CardContent>
    </Card>
  );
};