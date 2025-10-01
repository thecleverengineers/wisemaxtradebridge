import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BinaryTradingInterface } from '@/components/binary/BinaryTradingInterface';
import { SignalCard } from '@/components/binary/SignalCard';
import { ActiveTrades } from '@/components/binary/ActiveTrades';
import { TradeHistory } from '@/components/binary/TradeHistory';
import { BottomNavigation } from '@/components/layout/BottomNavigation';

export default function BinaryOptions() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [signals, setSignals] = useState<any[]>([]);
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingSignals, setGeneratingSignals] = useState(false);

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

  // Fetch active signals
  const fetchSignals = async () => {
    const { data, error } = await supabase
      .from('binary_signals')
      .select('*')
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      setSignals(data);
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

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchBalance();
    fetchSignals();
    fetchActiveTrades();
    fetchTradeHistory();
    setLoading(false);

    // Generate initial signals
    generateSignals();

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

    // Subscribe to new signals
    const signalsChannel = supabase
      .channel('signal-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'binary_signals'
      }, () => {
        fetchSignals();
      })
      .subscribe();

    // Auto-generate new signals every 15 seconds
    const signalInterval = setInterval(() => {
      generateSignals();
    }, 15000);

    return () => {
      walletChannel.unsubscribe();
      tradesChannel.unsubscribe();
      signalsChannel.unsubscribe();
      clearInterval(signalInterval);
    };
  }, [user]);

  // Function to generate new signals
  const generateSignals = async () => {
    setGeneratingSignals(true);
    try {
      // Try edge function first
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('signal-generator');
      
      if (edgeError) {
        console.error('Edge function error, falling back to client-side generation:', edgeError);
        
        // Fallback: Generate signals client-side
        const assetPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP'];
        const signals = [];
        const numSignals = Math.floor(Math.random() * 2) + 2; // Generate 2-3 signals
        
        for (let i = 0; i < numSignals; i++) {
          const randomPair = assetPairs[Math.floor(Math.random() * assetPairs.length)];
          const signalType = Math.random() > 0.5 ? 'CALL' : 'PUT';
          const strengthRandom = Math.random();
          const strength = strengthRandom < 0.33 ? 'weak' : strengthRandom < 0.66 ? 'medium' : 'strong';
          
          // Signal expires in 30-60 seconds
          const expirySeconds = Math.floor(Math.random() * 30) + 30;
          const expiresAt = new Date(Date.now() + expirySeconds * 1000);
          
          signals.push({
            asset_pair: randomPair,
            signal_type: signalType,
            strength: strength,
            expires_at: expiresAt.toISOString(),
            is_active: true
          });
        }
        
        // Deactivate old signals for the same asset pairs
        const pairsToUpdate = [...new Set(signals.map(s => s.asset_pair))];
        
        for (const pair of pairsToUpdate) {
          await supabase
            .from('binary_signals')
            .update({ is_active: false })
            .eq('asset_pair', pair)
            .eq('is_active', true);
        }
        
        // Insert new signals
        const { data, error } = await supabase
          .from('binary_signals')
          .insert(signals)
          .select();
        
        if (error) {
          console.error('Error inserting signals:', error);
          toast.error('Failed to generate signals');
        } else {
          console.log('Client-side signals generated:', data);
          toast.success(`Generated ${data.length} new signals`);
          fetchSignals(); // Refresh signals after generation
        }
      } else {
        console.log('Edge function signals generated:', edgeData);
        toast.success('New signals generated');
        fetchSignals(); // Refresh signals after generation
      }
    } catch (err) {
      console.error('Failed to generate signals:', err);
      toast.error('Failed to generate signals');
    } finally {
      setGeneratingSignals(false);
    }
  };

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

        {/* Live Signals */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Live Trading Signals</h2>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => generateSignals()}
              disabled={generatingSignals}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", generatingSignals && "animate-spin")} />
              {generatingSignals ? 'Generating...' : 'Refresh'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
            {signals.length === 0 && (
              <Card className="col-span-full bg-card/50 backdrop-blur border-primary/20">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No active signals at the moment</p>
                  <Button 
                    className="mt-4"
                    variant="outline"
                    size="sm"
                    onClick={() => generateSignals()}
                    disabled={generatingSignals}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-1", generatingSignals && "animate-spin")} />
                    Generate Signals Now
                  </Button>
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