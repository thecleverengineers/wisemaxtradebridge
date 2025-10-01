import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertCircle, BarChart3, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, ComposedChart, Bar } from 'recharts';

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

interface PriceData {
  time: string;
  price: number;
  signal?: 'CALL' | 'PUT';
  confidence?: number;
}

export function LiveTradingSignals() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Generate realistic trading signals
  const generateSignal = (): TradingSignal => {
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP'];
    const timeframes = ['1m', '5m', '15m', '30m', '1h'];
    const selectedPairLocal = pairs[Math.floor(Math.random() * pairs.length)];
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
      asset_pair: selectedPairLocal,
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

  // Initialize price history
  useEffect(() => {
    const initialData: PriceData[] = [];
    let lastPrice = 1.2000;
    
    for (let i = 29; i >= 0; i--) {
      const time = new Date(Date.now() - i * 2000);
      lastPrice += (Math.random() - 0.5) * 0.002;
      
      // Add signal markers at certain points
      const shouldAddSignal = Math.random() > 0.8;
      if (shouldAddSignal && i % 5 === 0) {
        initialData.push({
          time: time.toLocaleTimeString(),
          price: lastPrice,
          signal: Math.random() > 0.5 ? 'CALL' : 'PUT',
          confidence: 60 + Math.random() * 40
        });
      } else {
        initialData.push({
          time: time.toLocaleTimeString(),
          price: lastPrice
        });
      }
    }
    
    setPriceHistory(initialData);
    const initialSignals = Array.from({ length: 2 }, generateSignal);
    setSignals(initialSignals);
  }, []);

  // Update timer and price data
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Update price history
      setPriceHistory(prev => {
        const newData = [...prev];
        if (newData.length > 30) {
          newData.shift();
        }
        
        const lastPrice = newData[newData.length - 1]?.price || 1.2000;
        const newPrice = lastPrice + (Math.random() - 0.5) * 0.002;
        
        // Occasionally add a signal
        const shouldAddSignal = Math.random() > 0.9;
        if (shouldAddSignal) {
          const signal = generateSignal();
          newData.push({
            time: new Date().toLocaleTimeString(),
            price: newPrice,
            signal: signal.signal_type,
            confidence: signal.confidence
          });
          
          // Add to signals list
          setSignals(prevSignals => {
            const updated = prevSignals.filter(s => s.expires_in > 1).map(s => ({
              ...s,
              expires_in: s.expires_in - 1,
              current_price: s.current_price + (Math.random() - 0.5) * 0.0002
            }));
            if (updated.length < 4) {
              updated.push(signal);
            }
            return updated;
          });
        } else {
          newData.push({
            time: new Date().toLocaleTimeString(),
            price: newPrice
          });
        }
        
        return newData;
      });
      
      // Update signal expiry
      setSignals(prev => {
        return prev.map(signal => ({
          ...signal,
          current_price: signal.current_price + (Math.random() - 0.5) * 0.0002,
          expires_in: signal.expires_in - 1
        })).filter(signal => signal.expires_in > 0);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getSignalStrength = (confidence: number) => {
    if (confidence >= 80) return { label: 'STRONG', color: 'text-green-500' };
    if (confidence >= 60) return { label: 'MEDIUM', color: 'text-yellow-500' };
    return { label: 'WEAK', color: 'text-orange-500' };
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-sm font-semibold">
            Price: <span className="text-primary">{payload[0].value.toFixed(5)}</span>
          </p>
          {data.signal && (
            <>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn(
                  "text-xs",
                  data.signal === 'CALL' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                )}>
                  {data.signal}
                </Badge>
                <span className={cn("text-xs font-semibold", getSignalStrength(data.confidence).color)}>
                  {data.confidence?.toFixed(0)}%
                </span>
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  const SignalDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.signal) {
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill={payload.signal === 'CALL' ? '#10b981' : '#ef4444'}
            fillOpacity={0.8}
            stroke="#fff"
            strokeWidth={2}
          />
          <text
            x={cx}
            y={cy - 12}
            fill={payload.signal === 'CALL' ? '#10b981' : '#ef4444'}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
          >
            {payload.signal}
          </text>
        </g>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          Live Trading Signals
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-1 text-sm"
          >
            <option value="EUR/USD">EUR/USD</option>
            <option value="GBP/USD">GBP/USD</option>
            <option value="USD/JPY">USD/JPY</option>
            <option value="AUD/USD">AUD/USD</option>
            <option value="USD/CAD">USD/CAD</option>
            <option value="EUR/GBP">EUR/GBP</option>
          </select>
          <Badge variant="outline" className="bg-primary/10 border-primary/30">
            <span className="animate-pulse mr-2">●</span>
            Real-Time Analysis
          </Badge>
        </div>
      </div>

      {/* Main Chart */}
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {selectedPair} Price Action
            </span>
            <span className="text-sm text-muted-foreground font-normal">
              Last 30 signals
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                domain={['dataMin - 0.002', 'dataMax + 0.002']}
                tickFormatter={(value) => value.toFixed(4)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorPrice)"
                dot={<SignalDot />}
              />
              {priceHistory.filter(d => d.signal).map((entry, index) => (
                <ReferenceLine
                  key={index}
                  y={entry.price}
                  stroke={entry.signal === 'CALL' ? '#10b981' : '#ef4444'}
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Active Signals List */}
      <div className="grid gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Active Signals ({signals.length})
        </h3>
        {signals.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Analyzing markets for signals...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {signals.map((signal) => {
              const strength = getSignalStrength(signal.confidence);
              const pnl = ((signal.current_price - signal.entry_price) / signal.entry_price) * 100;
              const isProfit = signal.signal_type === 'CALL' ? pnl > 0 : pnl < 0;
              
              return (
                <Card key={signal.id} className="bg-card/50 backdrop-blur border-primary/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded",
                          signal.signal_type === 'CALL' ? 'bg-green-500/10' : 'bg-red-500/10'
                        )}>
                          {signal.signal_type === 'CALL' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{signal.asset_pair}</span>
                            <Badge variant="outline" className="text-xs h-5">
                              {signal.timeframe}
                            </Badge>
                            <Badge className={cn(
                              "text-xs h-5",
                              signal.signal_type === 'CALL' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                            )}>
                              {signal.signal_type}
                            </Badge>
                            <span className={cn("text-xs font-semibold", strength.color)}>
                              {strength.label} {signal.confidence.toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Entry: {signal.entry_price.toFixed(5)}</span>
                            <span>Current: {signal.current_price.toFixed(5)}</span>
                            <span className={cn(
                              "font-semibold",
                              isProfit ? 'text-green-500' : 'text-red-500'
                            )}>
                              {isProfit ? '+' : ''}{pnl.toFixed(3)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-lg font-bold",
                          signal.expires_in < 10 ? 'text-red-500 animate-pulse' : 'text-foreground'
                        )}>
                          {signal.expires_in}s
                        </div>
                        <div className="text-xs text-muted-foreground">expires</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}