import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, Activity, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Signal {
  id?: string;
  asset_pair: string;
  signal_type: 'CALL' | 'PUT';
  strength: 'weak' | 'medium' | 'strong';
  expires_at: string;
  created_at?: string;
  is_active?: boolean;
}

interface SignalCardProps {
  signal: Signal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    // Generate random chart data for visualization
    const data = Array.from({ length: 20 }, () => Math.random() * 40 + 30);
    setChartData(data);

    const calculateTimeLeft = () => {
      const expiry = new Date(signal.expires_at);
      const now = new Date();
      const diff = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [signal.expires_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStrengthPercentage = () => {
    switch (signal.strength) {
      case 'weak': return '55%';
      case 'medium': return '66%';
      case 'strong': return '80%';
      default: return '50%';
    }
  };

  const getStrengthColor = () => {
    switch (signal.strength) {
      case 'weak': return 'text-yellow-400';
      case 'medium': return 'text-blue-400';
      case 'strong': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  const isExpired = timeLeft === 0;
  const isCall = signal.signal_type === 'CALL';

  return (
    <Card className={cn(
      "relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50",
      "hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20",
      isExpired && "opacity-60"
    )}>
      <CardContent className="p-4">
        {/* Header with Asset Pair and Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">{signal.asset_pair}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <span className={cn(
              "font-mono",
              timeLeft < 10 && "text-red-400 animate-pulse"
            )}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Mini Chart Visualization */}
        <div className="h-16 mb-3 relative">
          <div className="absolute inset-0 flex items-end justify-between gap-0.5">
            {chartData.map((value, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 bg-gradient-to-t transition-all duration-300",
                  isCall 
                    ? "from-green-600/40 to-green-400/20" 
                    : "from-red-600/40 to-red-400/20"
                )}
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-slate-700/30" />
          </div>
        </div>

        {/* Signal Type and Strength */}
        <div className={cn(
          "rounded-lg p-3 backdrop-blur-sm",
          isCall 
            ? "bg-gradient-to-r from-green-600/20 to-green-500/10 border border-green-500/30" 
            : "bg-gradient-to-r from-red-600/20 to-red-500/10 border border-red-500/30"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCall ? (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-bold text-sm">BUY</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  <span className="text-red-400 font-bold text-sm">SELL</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={cn("text-2xl font-bold", getStrengthColor())}>
                {getStrengthPercentage()}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">
                {signal.strength}
              </div>
            </div>
          </div>
        </div>

        {/* Expired Overlay */}
        {isExpired && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-slate-400 font-semibold">EXPIRED</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}