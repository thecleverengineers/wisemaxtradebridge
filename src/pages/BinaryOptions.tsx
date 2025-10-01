import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BinaryTradingInterface } from '@/components/binary/BinaryTradingInterface';
import { ActiveTrades } from '@/components/binary/ActiveTrades';
import { TradeHistory } from '@/components/binary/TradeHistory';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { RealtimeSignalChart } from '@/components/binary/RealtimeSignalChart';

interface LocalSignal {
  id: string;
  asset_pair: string;
  signal_type: 'CALL' | 'PUT';
  strength: 'strong' | 'medium' | 'weak';
  price: number;
  timestamp: Date;
  expires_at: Date;
}

export default function BinaryOptions() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [localSignals, setLocalSignals] = useState<LocalSignal[]>([]);
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', 'USDT')
      .single();

    if (!error && data) {
      setBalance(data.balance);
    }
  };


  // Fetch active trades
  const fetchActiveTrades = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('binary_options_trades')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setActiveTrades(data);
    }
  };

  // Fetch trade history
  const fetchTradeHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('binary_options_trades')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['won', 'lost'])
      .order('settled_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTradeHistory(data);
    }
  };

  // Handle signal generation from charts
  const handleSignalGenerated = (signal: any) => {
    const newSignal: LocalSignal = {
      id: signal.id,
      asset_pair: signal.asset,
      signal_type: signal.type,
      strength: signal.strength,
      price: signal.price,
      timestamp: signal.time,
      expires_at: new Date(signal.time.getTime() + 60000) // Expires in 60 seconds
    };

    setLocalSignals(prev => {
      // Keep only the last 6 signals, remove expired ones
      const filtered = prev.filter(s => s.expires_at > new Date());
      return [...filtered, newSignal].slice(-6);
    });

    toast.success(`New ${signal.type} signal for ${signal.asset}`);
  };

  // Clean up expired signals
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalSignals(prev => prev.filter(s => s.expires_at > new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchBalance();
    fetchActiveTrades();
    fetchTradeHistory();
    setLoading(false);

    // Subscribe to wallet changes
    const walletChannel = supabase
      .channel('wallet-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchBalance();
      })
      .subscribe();

    // Subscribe to trade updates
    const tradesChannel = supabase
      .channel('trade-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'binary_options_trades',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchActiveTrades();
        fetchTradeHistory();
      })
      .subscribe();


    return () => {
      walletChannel.unsubscribe();
      tradesChannel.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background pb-20">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Binary Options Trading
          </h1>
          <p className="text-muted-foreground mt-2">Trade Call/Put options with up to 80% returns</p>
        </div>

        {/* Balance Card */}
        <Card className="mb-6 bg-card/50 backdrop-blur border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold text-primary">${balance.toFixed(2)}</p>
              </div>
              <Activity className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        {/* Live Charts with Signals */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Live Market Charts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RealtimeSignalChart assetPair="EUR/USD" onSignalGenerated={handleSignalGenerated} />
            <RealtimeSignalChart assetPair="GBP/USD" onSignalGenerated={handleSignalGenerated} />
            <RealtimeSignalChart assetPair="USD/JPY" onSignalGenerated={handleSignalGenerated} />
            <RealtimeSignalChart assetPair="AUD/USD" onSignalGenerated={handleSignalGenerated} />
          </div>
        </div>

        {/* Recent Signals */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Trading Signals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {localSignals.length > 0 ? (
              localSignals.map((signal) => (
                <Card key={signal.id} className={cn(
                  "bg-card/50 backdrop-blur border transition-all hover:shadow-lg",
                  signal.strength === 'strong' ? "border-green-500/50" :
                  signal.strength === 'medium' ? "border-yellow-500/50" :
                  "border-orange-500/50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{signal.asset_pair}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {Math.max(0, Math.floor((signal.expires_at.getTime() - Date.now()) / 1000))}s
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {signal.signal_type === 'CALL' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <span className="font-bold text-lg">{signal.signal_type}</span>
                          <p className="text-xs text-muted-foreground">@ {signal.price.toFixed(5)}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium uppercase",
                        signal.strength === 'strong' ? "bg-green-500/20 text-green-500" :
                        signal.strength === 'medium' ? "bg-yellow-500/20 text-yellow-500" :
                        "bg-orange-500/20 text-orange-500"
                      )}>
                        {signal.strength}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full bg-card/50 backdrop-blur border-primary/20">
                <CardContent className="p-6 text-center">
                  <Activity className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                  <p className="text-muted-foreground">Analyzing markets for signals...</p>
                  <p className="text-xs text-muted-foreground mt-2">Signals will appear automatically when detected</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Trading Interface */}
        <BinaryTradingInterface balance={balance} onTradePlace={() => {
          fetchBalance();
          fetchActiveTrades();
        }} />

        {/* Active Trades */}
        <ActiveTrades trades={activeTrades} />

        {/* Trade History */}
        <TradeHistory trades={tradeHistory} />
      </div>
      <BottomNavigation />
    </div>
  );
}