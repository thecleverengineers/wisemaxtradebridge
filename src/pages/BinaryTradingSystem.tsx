import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LiveSignals } from '@/components/binary/LiveSignals';
import { WalletDisplay } from '@/components/binary/WalletDisplay';
import { TradePanel } from '@/components/binary/TradePanel';
import { AdminPanel } from '@/components/binary/AdminPanel';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function BinaryTradingSystem() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [balance, setBalance] = useState(0);
  const isAdmin = searchParams.get('admin') === 'true';

  const fetchBalance = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', 'USDT')
      .single();

    if (data) {
      setBalance(data.balance);
    }
  };

  useEffect(() => {
    fetchBalance();

    if (user) {
      const channel = supabase
        .channel('wallet-balance-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchBalance();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background pb-20">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Binary Trading System
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time signals with integrated wallet management
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Signals */}
          <div className="lg:col-span-1 space-y-4">
            <LiveSignals />
            {isAdmin && <AdminPanel />}
          </div>

          {/* Middle Column - Trading */}
          <div className="lg:col-span-1">
            <TradePanel balance={balance} onTradeComplete={fetchBalance} />
          </div>

          {/* Right Column - Wallet */}
          <div className="lg:col-span-1">
            <WalletDisplay />
          </div>
        </div>

        {!user && (
          <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-center">
            <p className="text-yellow-500">Please login to start trading</p>
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}