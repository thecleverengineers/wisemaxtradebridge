import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  asset: string;
  direction: 'CALL' | 'PUT';
  amount: number;
  entry_price: number;
  expiry_time: string;
  status: string;
  created_at: string;
}

interface ActiveTradesProps {
  trades: Trade[];
}

export function ActiveTrades({ trades }: ActiveTradesProps) {
  const [timeLeftMap, setTimeLeftMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeftMap: Record<string, string> = {};
      
      trades.forEach(trade => {
        const now = new Date().getTime();
        const expiry = new Date(trade.expiry_time).getTime();
        const difference = expiry - now;

        if (difference > 0) {
          const minutes = Math.floor((difference / 1000 / 60) % 60);
          const seconds = Math.floor((difference / 1000) % 60);
          newTimeLeftMap[trade.id] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
          newTimeLeftMap[trade.id] = 'Settling...';
        }
      });

      setTimeLeftMap(newTimeLeftMap);
    }, 1000);

    return () => clearInterval(timer);
  }, [trades]);

  if (trades.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle>Active Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50"
            >
              <div className="flex items-center gap-3">
                {trade.direction === 'CALL' ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium text-foreground">{trade.asset}</p>
                  <p className="text-sm text-muted-foreground">
                    {trade.direction} • ${(trade.amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-4 w-4" />
                <span className="font-mono font-medium">
                  {timeLeftMap[trade.id] || 'Loading...'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}