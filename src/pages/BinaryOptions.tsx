import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BinaryTradingInterface } from '@/components/binary/BinaryTradingInterface';
import { LiveTradingSignals } from '@/components/binary/LiveTradingSignals';
import { ActiveTrades } from '@/components/binary/ActiveTrades';
import { TradeHistory } from '@/components/binary/TradeHistory';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';

export default function BinaryOptions() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [signals, setSignals] = useState<any[]>([]);
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
      .from('binary_records')
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
      .from('binary_records')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['won', 'lost'])
      .order('settled_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTradeHistory(data);
    }
  };

  // Auto-settle expired trades (frontend-only)
  const settleExpiredTrades = async () => {
    if (!user) return;

    try {
      // Query expired pending trades
      const { data: expiredTrades, error: fetchError } = await supabase
        .from('binary_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .lte('expiry_time', new Date().toISOString());

      if (fetchError) {
        console.error('Error fetching expired trades:', fetchError);
        return;
      }

      if (!expiredTrades || expiredTrades.length === 0) {
        return;
      }

      console.log(`Found ${expiredTrades.length} expired trades to settle`);

      // Settle each expired trade
      for (const trade of expiredTrades) {
        // Simulate price movement (±0.5% random)
        const priceMovement = (Math.random() - 0.5) * 0.01;
        const exitPrice = trade.entry_price * (1 + priceMovement);

        // Update the trade with exit price - this triggers the DB settlement logic
        const { error: updateError } = await supabase
          .from('binary_records')
          .update({
            exit_price: exitPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', trade.id)
          .eq('status', 'pending'); // Only update if still pending

        if (updateError) {
          console.error('Error settling trade:', updateError);
        }
      }
    } catch (error) {
      console.error('Error in settlement process:', error);
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
        table: 'binary_records',
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
        event: '*',
        schema: 'public',
        table: 'binary_signals'
      }, () => {
        fetchSignals();
      })
      .subscribe();

    // Auto-refresh signals every 10 seconds
    const signalInterval = setInterval(fetchSignals, 10000);
    
    // Auto-settle expired trades every 15 seconds
    const settlementInterval = setInterval(settleExpiredTrades, 15000);
    // Run immediately on mount
    settleExpiredTrades();

    return () => {
      walletChannel.unsubscribe();
      tradesChannel.unsubscribe();
      signalsChannel.unsubscribe();
      clearInterval(signalInterval);
      clearInterval(settlementInterval);
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background"></div>
      
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="pt-20 pb-20 relative z-10">
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

          {/* Live Trading Signals */}
          <div className="mb-6">
            <LiveTradingSignals />
          </div>

          {/* Trading Interface */}
          <BinaryTradingInterface balance={balance} onTradePlace={() => {
            fetchBalance();
            fetchActiveTrades();
          }} />

          {/* Active Trades */}
          <ActiveTrades trades={activeTrades} />

          {/* Betting Records - Trade History */}
          <div className="mt-8 mb-4">
            <TradeHistory trades={tradeHistory} />
          </div>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}