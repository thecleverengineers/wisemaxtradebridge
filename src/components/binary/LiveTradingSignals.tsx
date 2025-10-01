import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertCircle, BarChart3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
}

interface TradingSignal {
  id: string;
  asset_pair: string;
  signal_type: 'CALL' | 'PUT';
  entry_price: number;
  current_price: number;
  confidence: number;
  timeframe: string;
  indicators: TechnicalIndicator[];
  timestamp: Date;
  expires_in: number;
}

export function LiveTradingSignals() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Generate realistic trading signals
  const generateSignal = (): TradingSignal => {
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP'];
    const timeframes = ['1m', '5m', '15m', '30m', '1h'];
    const selectedPair = pairs[Math.floor(Math.random() * pairs.length)];
    const basePrice = 1.0000 + Math.random() * 0.5;
    
    // Generate technical indicators
    const rsi = 20 + Math.random() * 60;
    const macd = -0.002 + Math.random() * 0.004;
    const bb = -2 + Math.random() * 4;
    const stoch = Math.random() * 100;
    const ema = basePrice + (Math.random() - 0.5) * 0.01;
    
    const indicators: TechnicalIndicator[] = [
      {
        name: 'RSI(14)',
        value: rsi,
        signal: rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'NEUTRAL'
      },
      {
        name: 'MACD(12,26,9)',
        value: macd,
        signal: macd > 0 ? 'BUY' : macd < 0 ? 'SELL' : 'NEUTRAL'
      },
      {
        name: 'BB(20,2)',
        value: bb,
        signal: bb > 1 ? 'SELL' : bb < -1 ? 'BUY' : 'NEUTRAL'
      },
      {
        name: 'Stochastic(14,3,3)',
        value: stoch,
        signal: stoch > 80 ? 'SELL' : stoch < 20 ? 'BUY' : 'NEUTRAL'
      },
      {
        name: 'EMA(50)',
        value: ema,
        signal: basePrice > ema ? 'BUY' : 'SELL'
      }
    ];
    
    // Calculate overall signal based on indicators
    const buySignals = indicators.filter(i => i.signal === 'BUY').length;
    const sellSignals = indicators.filter(i => i.signal === 'SELL').length;
    const signal_type = buySignals > sellSignals ? 'CALL' : 'PUT';
    const confidence = Math.max(buySignals, sellSignals) / indicators.length * 100;
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      asset_pair: selectedPair,
      signal_type,
      entry_price: basePrice,
      current_price: basePrice + (Math.random() - 0.5) * 0.0005,
      confidence,
      timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
      indicators,
      timestamp: new Date(),
      expires_in: 30 + Math.floor(Math.random() * 90) // 30-120 seconds
    };
  };

  // Initialize with signals
  useEffect(() => {
    const initialSignals = Array.from({ length: 3 }, generateSignal);
    setSignals(initialSignals);
  }, []);

  // Update timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Update signal prices and remove expired ones
      setSignals(prev => {
        const updated = prev.map(signal => ({
          ...signal,
          current_price: signal.current_price + (Math.random() - 0.5) * 0.0002,
          expires_in: signal.expires_in - 1
        })).filter(signal => signal.expires_in > 0);
        
        // Add new signal occasionally
        if (Math.random() > 0.95 && updated.length < 5) {
          updated.push(generateSignal());
        }
        
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getSignalStrength = (confidence: number) => {
    if (confidence >= 80) return { label: 'STRONG', color: 'bg-green-500/20 text-green-500 border-green-500/30' };
    if (confidence >= 60) return { label: 'MEDIUM', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' };
    return { label: 'WEAK', color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          Live Trading Signals
        </h2>
        <Badge variant="outline" className="bg-primary/10 border-primary/30">
          <span className="animate-pulse mr-2">●</span>
          Real-Time Analysis
        </Badge>
      </div>

      {signals.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Analyzing markets...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {signals.map((signal) => {
            const strength = getSignalStrength(signal.confidence);
            const pnl = ((signal.current_price - signal.entry_price) / signal.entry_price) * 100;
            const isProfit = signal.signal_type === 'CALL' ? pnl > 0 : pnl < 0;
            
            return (
              <Card key={signal.id} className="bg-card/50 backdrop-blur border-primary/20 hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        signal.signal_type === 'CALL' ? 'bg-green-500/10' : 'bg-red-500/10'
                      )}>
                        {signal.signal_type === 'CALL' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{signal.asset_pair}</span>
                          <Badge variant="outline" className="text-xs">
                            {signal.timeframe}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-2xl font-bold",
                            signal.signal_type === 'CALL' ? 'text-green-500' : 'text-red-500'
                          )}>
                            {signal.signal_type}
                          </span>
                          <Badge className={cn("border", strength.color)}>
                            <Zap className="h-3 w-3 mr-1" />
                            {strength.label} {signal.confidence.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Expires in</div>
                      <div className={cn(
                        "text-xl font-bold",
                        signal.expires_in < 10 ? 'text-red-500 animate-pulse' : 'text-foreground'
                      )}>
                        {signal.expires_in}s
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
                      <div className="font-mono text-sm">{signal.entry_price.toFixed(5)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Current Price</div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm">{signal.current_price.toFixed(5)}</span>
                        <span className={cn(
                          "text-xs font-semibold",
                          isProfit ? 'text-green-500' : 'text-red-500'
                        )}>
                          {isProfit ? '+' : ''}{pnl.toFixed(3)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <BarChart3 className="h-3 w-3" />
                      Technical Indicators
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {signal.indicators.slice(0, 3).map((indicator, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="text-muted-foreground truncate">{indicator.name}</div>
                          <div className={cn(
                            "font-semibold",
                            indicator.signal === 'BUY' ? 'text-green-500' :
                            indicator.signal === 'SELL' ? 'text-red-500' : 'text-yellow-500'
                          )}>
                            {indicator.signal}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}