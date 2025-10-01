import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, History, DollarSign } from 'lucide-react';
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
  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit_loss, 0);
  const winCount = trades.filter(t => t.status === 'won').length;
  const lossCount = trades.filter(t => t.status === 'lost').length;
  const winRate = trades.length > 0 ? (winCount / trades.length * 100).toFixed(1) : '0';

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-bold">Betting Records</CardTitle>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total P/L</p>
              <p className={cn(
                "font-bold text-lg",
                totalProfit >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="font-bold text-lg text-primary">{winRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">W/L</p>
              <p className="font-bold text-lg">
                <span className="text-green-500">{winCount}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-red-500">{lossCount}</span>
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No betting records yet</p>
            <p className="text-sm">Your trade history will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="p-4">
              <div className="space-y-2">
                {trades.map((trade) => (
                  <div
                    key={trade.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md",
                      trade.status === 'won'
                        ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
                        : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        {trade.trade_type === 'CALL' ? (
                          <TrendingUp className="h-6 w-6 text-green-500" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-500" />
                        )}
                        {trade.status === 'won' ? (
                          <Badge className="mt-1 bg-green-500/20 text-green-500 border-green-500/40">
                            WIN
                          </Badge>
                        ) : (
                          <Badge className="mt-1 bg-red-500/20 text-red-500 border-red-500/40">
                            LOSS
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{trade.asset_pair}</p>
                          <Badge variant="outline" className="text-xs">
                            {trade.trade_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Stake:</span> ${trade.stake_amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Entry:</span> {trade.entry_price?.toFixed(5)}
                          </p>
                          {trade.exit_price && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Exit:</span> {trade.exit_price.toFixed(5)}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(trade.settled_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <DollarSign className={cn(
                          "h-4 w-4",
                          trade.profit_loss > 0 ? "text-green-500" : "text-red-500"
                        )} />
                        <p className={cn(
                          "font-bold text-xl",
                          trade.profit_loss > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {trade.profit_loss > 0 ? '+' : ''}{Math.abs(trade.profit_loss).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {trade.profit_loss > 0 
                          ? `+${((trade.profit_loss / trade.stake_amount) * 100).toFixed(0)}%`
                          : `-100%`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}