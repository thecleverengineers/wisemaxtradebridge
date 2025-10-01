import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeframes();
  }, []);

  const fetchTimeframes = async () => {
    try {
      const { data, error } = await supabase
        .from('binary_timeframes')
        .select('*')
        .eq('is_active', true)
        .order('duration_seconds');

      if (error) throw error;
      setTimeframes(data || []);
      
      // Select first timeframe by default
      if (data && data.length > 0 && !selectedTimeframe) {
        onSelectTimeframe(data[0]);
      }
    } catch (error) {
      console.error('Error fetching timeframes:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="text-center text-muted-foreground py-4">
            Loading timeframes...
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