import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertCircle, Wallet, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface TradePanelProps {
  selectedAsset: any;
  selectedTimeframe: any;
  balance: number;
  demoBalance: number;
  isDemoMode: boolean;
  onToggleDemoMode: (value: boolean) => void;
  onTradeComplete: () => void;
}

export const EnhancedTradePanel: React.FC<TradePanelProps> = ({
  selectedAsset,
  selectedTimeframe,
  balance,
  demoBalance,
  isDemoMode,
  onToggleDemoMode,
  onTradeComplete
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('10');
  const [processing, setProcessing] = useState(false);
  const [marketSettings, setMarketSettings] = useState<any>(null);
  const [riskSettings, setRiskSettings] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState({ trades: 0, losses: 0 });

  useEffect(() => {
    if (user) {
      fetchMarketSettings();
      fetchRiskSettings();
      fetchDailyStats();
    }
  }, [user]);

  const fetchMarketSettings = async () => {
    const { data } = await supabase
      .from('binary_market_settings')
      .select('*')
      .single();
    setMarketSettings(data);
  };

  const fetchRiskSettings = async () => {
    if (!user) return;
    
    let { data } = await supabase
      .from('binary_risk_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Create default settings if none exist
    if (!data) {
      const { data: newSettings } = await supabase
        .from('binary_risk_settings')
        .insert({ user_id: user.id })
        .select()
        .single();
      data = newSettings;
    }
    
    setRiskSettings(data);
  };

  const fetchDailyStats = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('binary_options_trades')
      .select('stake_amount, profit_loss')
      .eq('user_id', user.id)
      .eq('is_demo', isDemoMode)
      .gte('created_at', today);

    if (data) {
      const trades = data.length;
      const losses = data.reduce((sum, trade) => 
        sum + (trade.profit_loss < 0 ? Math.abs(trade.profit_loss) : 0), 0
      );
      setDailyStats({ trades, losses });
    }
  };

  const validateTrade = () => {
    if (!selectedAsset) {
      toast.error('Please select an asset');
      return false;
    }

    if (!selectedTimeframe) {
      toast.error('Please select a timeframe');
      return false;
    }

    const tradeAmount = parseFloat(amount);
    const currentBalance = isDemoMode ? demoBalance : balance;

    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }

    if (tradeAmount > currentBalance) {
      toast.error('Insufficient balance');
      return false;
    }

    // Check risk settings
    if (riskSettings) {
      if (riskSettings.is_self_excluded) {
        toast.error('Trading is disabled due to self-exclusion');
        return false;
      }

      if (dailyStats.trades >= riskSettings.max_daily_trades) {
        toast.error(`Daily trade limit reached (${riskSettings.max_daily_trades})`);
        return false;
      }

      if (dailyStats.losses >= riskSettings.max_daily_loss) {
        toast.error(`Daily loss limit reached ($${riskSettings.max_daily_loss})`);
        return false;
      }

      if (tradeAmount > riskSettings.max_trade_size) {
        toast.error(`Maximum trade size is $${riskSettings.max_trade_size}`);
        return false;
      }
    }

    // Check market settings
    if (marketSettings) {
      if (!marketSettings.is_trading_enabled) {
        toast.error('Trading is currently disabled');
        return false;
      }

      if (marketSettings.maintenance_mode) {
        toast.error('System is under maintenance');
        return false;
      }

      if (tradeAmount < marketSettings.min_trade_size) {
        toast.error(`Minimum trade size is $${marketSettings.min_trade_size}`);
        return false;
      }

      if (tradeAmount > marketSettings.max_trade_size) {
        toast.error(`Maximum trade size is $${marketSettings.max_trade_size}`);
        return false;
      }
    }

    return true;
  };

  const placeTrade = async (tradeType: 'CALL' | 'PUT') => {
    if (!user) {
      toast.error('Please login to trade');
      return;
    }

    if (!validateTrade()) return;

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Calculate final payout rate
      const basePayout = selectedAsset.payout_rate;
      const timeframeMultiplier = selectedTimeframe.payout_multiplier;
      const globalMultiplier = marketSettings?.global_payout_multiplier || 1;
      const finalPayout = basePayout * timeframeMultiplier * globalMultiplier;

      const { error } = await supabase.functions.invoke('enhanced-place-trade', {
        body: {
          assetId: selectedAsset.id,
          timeframeId: selectedTimeframe.id,
          signalType: tradeType,
          amount: parseFloat(amount),
          isDemoMode,
          payoutRate: finalPayout,
          marketMode: marketSettings?.market_mode || 'random'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success(`${tradeType} trade placed on ${selectedAsset.symbol}!`);
      onTradeComplete();
      fetchDailyStats();
      
      // Reset amount after successful trade
      setAmount('10');
    } catch (error: any) {
      console.error('Trade error:', error);
      toast.error(error.message || 'Failed to place trade');
    } finally {
      setProcessing(false);
    }
  };

  const quickAmounts = [10, 25, 50, 100, 250, 500];
  const currentBalance = isDemoMode ? demoBalance : balance;

  // Calculate potential payout
  const calculatePayout = () => {
    if (!selectedAsset || !selectedTimeframe) return 0;
    const basePayout = selectedAsset.payout_rate;
    const timeframeMultiplier = selectedTimeframe.payout_multiplier;
    const globalMultiplier = marketSettings?.global_payout_multiplier || 1;
    return basePayout * timeframeMultiplier * globalMultiplier;
  };

  const potentialPayout = calculatePayout();
  const potentialWin = parseFloat(amount) * potentialPayout;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <Label htmlFor="demo-mode">Demo Mode</Label>
          </div>
          <Switch
            id="demo-mode"
            checked={isDemoMode}
            onCheckedChange={onToggleDemoMode}
          />
        </div>

        {/* Balance Display */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            {isDemoMode ? 'Demo Balance' : 'Real Balance'}
          </div>
          <div className="text-3xl font-bold">
            ${currentBalance.toFixed(2)}
          </div>
        </div>

        {/* Selected Asset & Timeframe */}
        {selectedAsset && selectedTimeframe && (
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Asset:</span>
              <span className="font-medium">{selectedAsset.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expiry:</span>
              <span className="font-medium">{selectedTimeframe.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payout:</span>
              <span className="font-medium text-green-500">
                {(potentialPayout * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Trade Amount Input */}
        <div className="space-y-2">
          <Label>Trade Amount ($)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max={currentBalance}
            step="1"
            disabled={processing}
          />
          
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map(quickAmount => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                onClick={() => setAmount(quickAmount.toString())}
                disabled={processing || quickAmount > currentBalance}
              >
                ${quickAmount}
              </Button>
            ))}
          </div>
        </div>

        {/* Potential Payout Display */}
        {parseFloat(amount) > 0 && (
          <div className="p-3 bg-green-500/10 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Potential Win:</span>
              <span className="font-semibold text-green-500">
                +${potentialWin.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Return:</span>
              <span className="font-semibold">
                ${(parseFloat(amount) + potentialWin).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Risk Warnings */}
        {riskSettings && (
          <div className="space-y-2">
            {dailyStats.trades >= riskSettings.max_daily_trades * 0.8 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You've placed {dailyStats.trades} of {riskSettings.max_daily_trades} daily trades
                </AlertDescription>
              </Alert>
            )}
            
            {dailyStats.losses >= riskSettings.max_daily_loss * 0.8 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Daily losses: ${dailyStats.losses.toFixed(2)} of ${riskSettings.max_daily_loss} limit
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Trade Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="bg-green-500 hover:bg-green-600"
            onClick={() => placeTrade('CALL')}
            disabled={processing || !selectedAsset || !selectedTimeframe || !user}
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            CALL (UP)
          </Button>
          
          <Button
            size="lg"
            className="bg-red-500 hover:bg-red-600"
            onClick={() => placeTrade('PUT')}
            disabled={processing || !selectedAsset || !selectedTimeframe || !user}
          >
            <TrendingDown className="mr-2 h-5 w-5" />
            PUT (DOWN)
          </Button>
        </div>

        {!user && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please login to start trading
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
};