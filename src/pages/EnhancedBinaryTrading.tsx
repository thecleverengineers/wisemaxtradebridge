import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AssetSelector } from '@/components/binary/AssetSelector';
import { TimeframeSelector } from '@/components/binary/TimeframeSelector';
import { EnhancedTradePanel } from '@/components/binary/EnhancedTradePanel';
import { ActiveTradesList } from '@/components/binary/ActiveTradesList';
import { TradeHistoryPanel } from '@/components/binary/TradeHistoryPanel';
import { PriceChart } from '@/components/binary/PriceChart';
import { Leaderboard } from '@/components/binary/Leaderboard';
import { AdminDashboard } from '@/components/binary/AdminDashboard';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, History, Trophy, Settings, BarChart3 } from 'lucide-react';

export default function EnhancedBinaryTrading() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [balance, setBalance] = useState(0);
  const [demoBalance, setDemoBalance] = useState(10000);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBalances();
      checkAdminRole();
      
      // Set up real-time balance updates
      const channel = supabase
        .channel('wallet-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchBalances();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchBalances = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('wallets')
      .select('balance, demo_balance, is_demo_active')
      .eq('user_id', user.id)
      .eq('currency', 'USDT')
      .single();

    if (data) {
      setBalance(data.balance);
      setDemoBalance(data.demo_balance || 10000);
      setIsDemoMode(data.is_demo_active || false);
    }
  };

  const checkAdminRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    setIsAdmin(data?.role === 'admin' || searchParams.get('admin') === 'true');
  };

  const handleToggleDemoMode = async (value: boolean) => {
    if (!user) return;
    
    setIsDemoMode(value);
    
    // Update database
    await supabase
      .from('wallets')
      .update({ is_demo_active: value })
      .eq('user_id', user.id)
      .eq('currency', 'USDT');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background pb-20">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Advanced Binary Trading
          </h1>
          <p className="text-muted-foreground mt-2">
            Trade 15+ assets with multiple timeframes
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Asset Selection */}
          <div className="lg:col-span-1">
            <AssetSelector 
              selectedAsset={selectedAsset}
              onSelectAsset={setSelectedAsset}
            />
          </div>

          {/* Center Column - Chart & Trading */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price Chart */}
            {selectedAsset && (
              <Card className="p-4">
                <PriceChart 
                  asset={selectedAsset}
                  timeframe={selectedTimeframe}
                />
              </Card>
            )}

            {/* Tabs for Trading Interface */}
            <Tabs defaultValue="trade" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="trade" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Trade
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  Leaders
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trade" className="space-y-4">
                <TimeframeSelector
                  selectedTimeframe={selectedTimeframe}
                  onSelectTimeframe={setSelectedTimeframe}
                />
                <EnhancedTradePanel
                  selectedAsset={selectedAsset}
                  selectedTimeframe={selectedTimeframe}
                  balance={balance}
                  demoBalance={demoBalance}
                  isDemoMode={isDemoMode}
                  onToggleDemoMode={handleToggleDemoMode}
                  onTradeComplete={fetchBalances}
                />
              </TabsContent>

              <TabsContent value="active">
                <ActiveTradesList isDemoMode={isDemoMode} />
              </TabsContent>

              <TabsContent value="history">
                <TradeHistoryPanel isDemoMode={isDemoMode} />
              </TabsContent>

              <TabsContent value="leaderboard">
                <Leaderboard />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Market Info */}
            {selectedAsset && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Market Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h High:</span>
                    <span>${selectedAsset.day_high?.toFixed(4) || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Low:</span>
                    <span>${selectedAsset.day_low?.toFixed(4) || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prev Close:</span>
                    <span>${selectedAsset.previous_close?.toFixed(4) || '--'}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* User Stats */}
            {user && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Your Stats Today</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Trades:</span>
                    <span>0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate:</span>
                    <span>--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit/Loss:</span>
                    <span>$0.00</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Admin Dashboard */}
        {isAdmin && (
          <div className="mt-6">
            <AdminDashboard />
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}