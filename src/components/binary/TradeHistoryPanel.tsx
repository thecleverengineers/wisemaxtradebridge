import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Trophy, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  asset_pair: string;
  trade_type: string;
  stake_amount: number;
  entry_price: number;
  exit_price: number;
  profit_loss: number;
  status: string;
  created_at: string;
  settled_at: string;
  payout_rate: number;
}

interface TradeHistoryPanelProps {
  isDemoMode: boolean;
}

export const TradeHistoryPanel: React.FC<TradeHistoryPanelProps> = ({ isDemoMode }) => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalProfit: 0
  });

  useEffect(() => {
    if (user) {
      fetchTradeHistory();
    }
  }, [user, isDemoMode]);

  const fetchTradeHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('binary_options_trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_demo', isDemoMode)
        .in('status', ['won', 'lost'])
        .order('settled_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const tradeData = data || [];
      setTrades(tradeData);
      
      // Calculate stats
      const wins = tradeData.filter(t => t.status === 'won').length;
      const losses = tradeData.filter(t => t.status === 'lost').length;
      const totalProfit = tradeData.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      
      setStats({
        totalTrades: tradeData.length,
        wins,
        losses,
        winRate: tradeData.length > 0 ? (wins / tradeData.length) * 100 : 0,
        totalProfit
      });
    } catch (error) {
      console.error('Error fetching trade history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Loading trade history...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
            <div className="text-xs text-muted-foreground">Total Trades</div>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg">
            <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
          <div className="text-center p-3 bg-blue-500/10 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">{stats.winRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className={cn(
              "text-2xl font-bold",
              stats.totalProfit >= 0 ? "text-green-500" : "text-red-500"
            )}>
              ${Math.abs(stats.totalProfit).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Total P/L</div>
          </div>
        </div>

        {/* Trade History List */}
        <div>
          <h3 className="font-semibold mb-3">Recent Trades</h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {trades.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No trade history yet
                </div>
              ) : (
                trades.map(trade => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        {trade.trade_type === 'CALL' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-xs">{trade.trade_type}</span>
                      </div>
                      
                      <div>
                        <div className="font-medium">{trade.asset_pair}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(trade.settled_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm">
                          ${trade.stake_amount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${trade.entry_price.toFixed(4)} → ${trade.exit_price?.toFixed(4) || '--'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {trade.status === 'won' ? (
                          <>
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <Badge variant="default" className="bg-green-500">
                              +${Math.abs(trade.profit_loss).toFixed(2)}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 text-red-500" />
                            <Badge variant="destructive">
                              -${Math.abs(trade.profit_loss).toFixed(2)}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
};