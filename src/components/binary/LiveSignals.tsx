import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Signal {
  id: string;
  type: 'CALL' | 'PUT';
  asset_pair: string;
  strength: string;
  timestamp: string;
  expires_at: string;
}

export const LiveSignals: React.FC = () => {
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  const fetchSignal = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('trading-signals');
      
      if (error) throw error;
      
      if (data?.signal) {
        setSignal(data.signal);
        setTimeLeft(15);
      }
    } catch (error) {
      console.error('Error fetching signal:', error);
      // Fallback to database
      const { data } = await supabase
        .from('binary_signals')
        .select('*')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setSignal({
          id: data[0].id,
          type: data[0].signal_type as 'CALL' | 'PUT',
          asset_pair: data[0].asset_pair,
          strength: data[0].strength,
          timestamp: data[0].created_at,
          expires_at: data[0].expires_at
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSignal();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchSignal();
    }, 15000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse text-primary text-center">Loading signals...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Live Trading Signal</CardTitle>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">LIVE</span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={fetchSignal}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {signal ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {signal.type === 'CALL' ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <p className="text-2xl font-bold">
                    <span className={signal.type === 'CALL' ? 'text-green-500' : 'text-red-500'}>
                      {signal.type}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">{signal.asset_pair}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Strength</p>
                <p className={cn(
                  "font-semibold capitalize",
                  signal.strength === 'strong' && "text-green-500",
                  signal.strength === 'medium' && "text-yellow-500",
                  signal.strength === 'weak' && "text-orange-500"
                )}>
                  {signal.strength}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Next update in {timeLeft}s</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(signal.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-primary/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No active signals</p>
            <Button 
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={fetchSignal}
            >
              Check for signals
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};