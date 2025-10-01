import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBinaryData } from '@/contexts/BinaryDataContext';

interface Timeframe {
  id: string;
  name: string;
  duration_seconds: number;
  payout_multiplier: number;
  min_stake: number;
  max_stake: number;
}

interface TimeframeSelectorProps {
  selectedTimeframe: Timeframe | null;
  onSelectTimeframe: (timeframe: Timeframe) => void;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selectedTimeframe,
  onSelectTimeframe
}) => {
  const { timeframes, loading, error, refetch } = useBinaryData();

  useEffect(() => {
    // Select first timeframe by default
    if (timeframes.length > 0 && !selectedTimeframe) {
      onSelectTimeframe(timeframes[0]);
    }
  }, [timeframes]);

  const getTimeframeIcon = (duration: number) => {
    if (duration <= 60) return <Zap className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getTimeframeColor = (duration: number) => {
    if (duration <= 30) return 'text-red-500';
    if (duration <= 60) return 'text-orange-500';
    if (duration <= 300) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Select Expiry Time
        </h3>
        
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {error}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={refetch}
              variant="outline"
              size="sm"
              className="mt-3 w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : timeframes.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No timeframes available
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {timeframes.map(timeframe => (
              <Button
                key={timeframe.id}
                variant={selectedTimeframe?.id === timeframe.id ? "default" : "outline"}
                className={cn(
                  "relative",
                  selectedTimeframe?.id === timeframe.id && "ring-2 ring-primary"
                )}
                onClick={() => onSelectTimeframe(timeframe)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className={getTimeframeColor(timeframe.duration_seconds)}>
                    {getTimeframeIcon(timeframe.duration_seconds)}
                  </span>
                  <span className="font-semibold">{timeframe.name}</span>
                  {timeframe.payout_multiplier !== 1 && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {(timeframe.payout_multiplier * 100 - 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}
        
        {selectedTimeframe && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Stake:</span>
              <span className="font-medium">${selectedTimeframe.min_stake}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Stake:</span>
              <span className="font-medium">${selectedTimeframe.max_stake}</span>
            </div>
            {selectedTimeframe.payout_multiplier !== 1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payout Bonus:</span>
                <span className="font-medium text-green-500">
                  +{((selectedTimeframe.payout_multiplier - 1) * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};