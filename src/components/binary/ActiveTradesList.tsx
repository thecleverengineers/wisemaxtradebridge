import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ActiveTrade {
  id: string;
  asset_pair: string;
  trade_type: string;
  stake_amount: number;
  entry_price: number;
  expiry_time: string;
  created_at: string;
  payout_rate: number;
  is_demo: boolean;
}

interface ActiveTradesListProps {
  isDemoMode: boolean;
}

export const ActiveTradesList: React.FC<ActiveTradesListProps> = ({ isDemoMode }) => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<ActiveTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActiveTrades();
      
      // Set up real-time updates
      const channel = supabase
        .channel('active-trades')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'binary_options_trades',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchActiveTrades();
        })
        .subscribe();

      // Refresh every second for countdown
      const interval = setInterval(() => {
        setTrades(prev => [...prev]); // Force re-render for countdown
      }, 1000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [user, isDemoMode]);

  const fetchActiveTrades = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('binary_options_trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_demo', isDemoMode)
        .eq('status', 'pending')
        .gte('expiry_time', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching active trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (expiryTime: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiryTime).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Settling...';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getProgressPercentage = (createdAt: string, expiryTime: string) => {
    const now = new Date().getTime();
    const start = new Date(createdAt).getTime();
    const end = new Date(expiryTime).getTime();
    const total = end - start;
    const elapsed = now - start;
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Loading active trades...
        </div>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No active trades
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Active Trades</h3>
      <div className="space-y-3">
        {trades.map(trade => {
          const timeRemaining = getTimeRemaining(trade.expiry_time);
          const progress = getProgressPercentage(trade.created_at, trade.expiry_time);
          const potentialWin = trade.stake_amount * trade.payout_rate;

          return (
            <div
              key={trade.id}
              className="p-4 border rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {trade.trade_type === 'CALL' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-semibold">{trade.asset_pair}</span>
                  <Badge variant={trade.trade_type === 'CALL' ? 'default' : 'destructive'}>
                    {trade.trade_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-3 w-3" />
                  <span className={cn(
                    "font-mono",
                    progress > 80 && "text-orange-500",
                    progress > 90 && "text-red-500"
                  )}>
                    {timeRemaining}
                  </span>
                </div>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Stake</div>
                  <div className="font-medium">${trade.stake_amount}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Entry</div>
                  <div className="font-medium">${trade.entry_price.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Win</div>
                  <div className="font-medium text-green-500">
                    +${potentialWin.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};