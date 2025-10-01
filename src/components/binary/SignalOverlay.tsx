import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignalOverlayProps {
  signal: any;
  onClose: () => void;
}

export const SignalOverlay: React.FC<SignalOverlayProps> = ({ signal, onClose }) => {
  if (!signal) return null;

  const getTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(signal.expires_at);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getRecommendedStake = () => {
    switch (signal.strength) {
      case 'strong': return '$50 - $100';
      case 'medium': return '$25 - $50';
      case 'weak': return '$10 - $25';
      default: return '$25';
    }
  };

  return (
    <Card className="absolute top-20 left-4 z-50 p-4 w-64 shadow-lg bg-background/95 backdrop-blur-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {signal.signal_type === 'CALL' ? (
            <TrendingUp className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
          <span className="font-semibold text-lg">{signal.signal_type}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-muted-foreground">Asset Pair</div>
          <div className="font-medium">{signal.asset_pair}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Entry Price</div>
          <div className="font-medium">${signal.entry_price?.toFixed(4) || '1.0800'}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Signal Strength</div>
          <Badge 
            variant={
              signal.strength === 'strong' ? 'default' :
              signal.strength === 'medium' ? 'secondary' :
              'outline'
            }
            className="mt-1"
          >
            {signal.strength?.toUpperCase()}
          </Badge>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Time Remaining</div>
          <div className="flex items-center gap-1 font-medium">
            <Clock className="w-4 h-4" />
            {getTimeRemaining()}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Recommended Stake</div>
          <div className="font-medium text-primary">{getRecommendedStake()}</div>
        </div>

        {signal.analysis && (
          <div>
            <div className="text-xs text-muted-foreground">Analysis</div>
            <div className="text-sm mt-1">{signal.analysis}</div>
          </div>
        )}
      </div>

      <Button 
        className="w-full mt-4"
        variant={signal.signal_type === 'CALL' ? 'default' : 'destructive'}
      >
        Place {signal.signal_type} Trade
      </Button>
    </Card>
  );
};