import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  asset_pair: string;
  trade_type: 'CALL' | 'PUT';
  stake_amount: number;
  entry_price: number;
  exit_price?: number;
  status: 'won' | 'lost';
  profit_loss: number;
  settled_at: string;
}

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (trades.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border",
                trade.status === 'won'
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  {trade.trade_type === 'CALL' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  {trade.status === 'won' ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-1" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{trade.asset_pair}</p>
                  <p className="text-sm text-muted-foreground">
                    {trade.trade_type} • ${trade.stake_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(trade.settled_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={cn(
                  "font-bold text-lg",
                  trade.profit_loss > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {trade.profit_loss > 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {trade.status === 'won' ? 'WIN' : 'LOSS'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}