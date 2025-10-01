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
    console.log('Fetching signals...');
    const { data, error } = await supabase
      .from('binary_signals')
      .select('*')
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching signals:', error);
    } else {
      console.log('Fetched signals:', data);
      setSignals(data || []);
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
    const initializeData = async () => {
      setLoading(true);
      await fetchBalance();
      await fetchActiveTrades();
      await fetchTradeHistory();
      
      // Check if there are existing signals first
      await fetchSignals();
      
      // Generate initial signals after a short delay
      setTimeout(() => {
        generateSignals();
      }, 1000);
      
      setLoading(false);
    };
    
    initializeData();

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
    console.log('Starting signal generation...');
    
    try {
      // Generate signals client-side directly for immediate feedback
      const assetPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP'];
      const signals = [];
      const numSignals = 3; // Always generate 3 signals for consistency
      
      for (let i = 0; i < numSignals; i++) {
        const randomPair = assetPairs[Math.floor(Math.random() * assetPairs.length)];
        const signalType = Math.random() > 0.5 ? 'CALL' : 'PUT';
        const strengthRandom = Math.random();
        const strength = strengthRandom < 0.33 ? 'weak' : strengthRandom < 0.66 ? 'medium' : 'strong';
        
        // Signal expires in 45-90 seconds for better visibility
        const expirySeconds = Math.floor(Math.random() * 45) + 45;
        const expiresAt = new Date(Date.now() + expirySeconds * 1000);
        
        signals.push({
          asset_pair: randomPair,
          signal_type: signalType,
          strength: strength,
          expires_at: expiresAt.toISOString(),
          is_active: true
        });
      }
      
      console.log('Generated signals:', signals);
      
      // First deactivate ALL old signals
      const { error: deactivateError } = await supabase
        .from('binary_signals')
        .update({ is_active: false })
        .eq('is_active', true);
      
      if (deactivateError) {
        console.error('Error deactivating old signals:', deactivateError);
      }
      
      // Insert new signals
      const { data, error } = await supabase
        .from('binary_signals')
        .insert(signals)
        .select();
      
      if (error) {
        console.error('Error inserting signals:', error);
        toast.error('Failed to generate signals: ' + error.message);
      } else {
        console.log('Signals inserted successfully:', data);
        toast.success(`Generated ${data.length} new trading signals`);
        // Immediately update state with new signals
        setSignals(data);
      }
    } catch (err) {
      console.error('Failed to generate signals:', err);
      toast.error('Failed to generate signals: ' + (err as Error).message);
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

        {/* Live Trading Signals - Real-time Updates */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">Live Trading Signals</h2>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">LIVE</span>
              </div>
            </div>
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
          
          {/* Real-time Signal Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {signals.length > 0 ? (
              signals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))
            ) : (
              <Card className="col-span-full bg-card/50 backdrop-blur border-primary/20">
                <CardContent className="p-6 text-center">
                  <Activity className="h-12 w-12 text-primary/50 mx-auto mb-3 animate-pulse" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Waiting for Live Signals</h3>
                  <p className="text-muted-foreground text-sm mb-4">New signals are generated automatically every 15 seconds</p>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Auto-refresh enabled</span>
                  </div>
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
          
          {/* Signal Update Indicator */}
          {signals.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Next update in 15 seconds</span>
            </div>
          )}
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