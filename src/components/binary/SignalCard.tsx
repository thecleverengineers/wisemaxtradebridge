import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Signal {
  id: string;
  asset_pair: string;
  signal_type: 'CALL' | 'PUT';
  strength: 'strong' | 'medium' | 'weak';
  expires_at: string;
  created_at: string;
}

interface SignalCardProps {
  signal: Signal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(signal.expires_at).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${seconds}s`);
      } else {
        setTimeLeft('Expired');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [signal.expires_at]);

  const strengthColors = {
    strong: 'text-green-500 bg-green-500/10 border-green-500/20',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    weak: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
  };

  return (
    <Card className={cn(
      "bg-card/50 backdrop-blur border transition-all hover:shadow-lg",
      strengthColors[signal.strength]
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-foreground">{signal.asset_pair}</span>
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>{timeLeft}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {signal.signal_type === 'CALL' ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            <span className="font-bold text-lg">{signal.signal_type}</span>
          </div>
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium uppercase",
            strengthColors[signal.strength]
          )}>
            {signal.strength}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}