import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertCircle, BarChart3, Zap, Clock, Signal, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
        <div className="bg-black/90 backdrop-blur-xl border border-primary/30 rounded-xl p-4 shadow-2xl shadow-primary/20">
          <p className="text-xs text-primary/70 mb-2 font-semibold uppercase tracking-wider">{label}</p>
          <p className="text-base font-bold">
            <span className="text-muted-foreground">Price: </span>
            <span className="text-primary text-lg">{payload[0].value.toFixed(5)}</span>
          </p>
          {data.signal && (
            <>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-primary/20">
                <Badge className={cn(
                  "text-xs font-bold px-3 py-1 shadow-lg",
                  data.signal === 'CALL' 
                    ? 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-400 border-green-500/40' 
                    : 'bg-gradient-to-r from-red-500/30 to-red-600/30 text-red-400 border-red-500/40'
                )}>
                  {data.signal === 'CALL' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {data.signal}
                </Badge>
                <span className={cn("text-sm font-bold flex items-center gap-1", 
                  data.confidence > 80 ? 'text-green-400' : 
                  data.confidence > 60 ? 'text-yellow-400' : 
                  'text-orange-400'
                )}>
                  <Zap className="h-3 w-3" />
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
    <div className="space-y-6 p-1">
      {/* Header with gradient background */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-2xl blur-2xl" />
        <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-primary/20 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
                <div className="relative">
                  <Signal className="h-6 w-6 text-primary animate-pulse" />
                  <div className="absolute inset-0 blur-xl bg-primary/50" />
                </div>
                Live Trading Signals
              </h2>
              <p className="text-xs text-muted-foreground mt-1">AI-Powered Technical Analysis</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="bg-black/60 border border-primary/30 rounded-xl px-4 py-2 text-sm text-foreground backdrop-blur-xl hover:border-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="EUR/USD">EUR/USD</option>
                <option value="GBP/USD">GBP/USD</option>
                <option value="USD/JPY">USD/JPY</option>
                <option value="AUD/USD">AUD/USD</option>
                <option value="USD/CAD">USD/CAD</option>
                <option value="EUR/GBP">EUR/GBP</option>
              </select>
              <Badge className="bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/30 text-green-400 shadow-lg shadow-green-500/20">
                <span className="animate-pulse mr-2 text-green-400">●</span>
                LIVE FEED
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart with dark theme */}
      <Card className="relative bg-black/60 backdrop-blur-2xl border border-primary/20 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <CardHeader className="relative">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-3">
              <div className="relative">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div className="absolute inset-0 blur-lg bg-primary/40" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {selectedPair} Price Action
              </span>
            </span>
            <span className="text-xs text-muted-foreground/60 font-normal px-3 py-1 bg-black/40 rounded-full border border-primary/20">
              Live Feed • 30 Signals
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary))" opacity={0.1} />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                interval="preserveStartEnd"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                domain={['dataMin - 0.002', 'dataMax + 0.002']}
                tickFormatter={(value) => value.toFixed(4)}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fill="url(#colorPrice)"
                dot={<SignalDot />}
                filter="url(#glow)"
              />
              {priceHistory.filter(d => d.signal).map((entry, index) => (
                <ReferenceLine
                  key={index}
                  y={entry.price}
                  stroke={entry.signal === 'CALL' ? '#10b981' : '#ef4444'}
                  strokeDasharray="5 5"
                  strokeOpacity={0.7}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Active Signals List with modern dark design */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-3">
            <div className="relative">
              <Clock className="h-5 w-5 text-primary" />
              <div className="absolute inset-0 blur-lg bg-primary/40" />
            </div>
            Active Signals
            <Badge className="ml-2 bg-primary/20 text-primary border-primary/30 font-bold">
              {signals.length} LIVE
            </Badge>
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">CALL</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-400">PUT</span>
            </div>
          </div>
        </div>
        
        {signals.length === 0 ? (
          <Card className="bg-black/60 backdrop-blur-xl border border-primary/20 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="relative inline-block">
                <AlertCircle className="h-8 w-8 text-primary/60 mx-auto mb-3" />
                <div className="absolute inset-0 blur-2xl bg-primary/30" />
              </div>
              <p className="text-sm text-muted-foreground">Scanning market patterns...</p>
              <div className="flex justify-center gap-1 mt-3">
                <div className="h-1 w-8 bg-primary/40 rounded-full animate-pulse" />
                <div className="h-1 w-8 bg-primary/40 rounded-full animate-pulse delay-100" />
                <div className="h-1 w-8 bg-primary/40 rounded-full animate-pulse delay-200" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {signals.map((signal) => {
              const strength = getSignalStrength(signal.confidence);
              const pnl = ((signal.current_price - signal.entry_price) / signal.entry_price) * 100;
              const isProfit = signal.signal_type === 'CALL' ? pnl > 0 : pnl < 0;
              
              return (
                <Card key={signal.id} className="relative bg-black/60 backdrop-blur-xl border border-primary/20 shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-300 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="relative p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "relative p-2.5 rounded-xl shadow-lg",
                          signal.signal_type === 'CALL' 
                            ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30' 
                            : 'bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30'
                        )}>
                          {signal.signal_type === 'CALL' ? (
                            <>
                              <TrendingUp className="h-5 w-5 text-green-400" />
                              <div className="absolute inset-0 blur-xl bg-green-500/30 rounded-xl" />
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-5 w-5 text-red-400" />
                              <div className="absolute inset-0 blur-xl bg-red-500/30 rounded-xl" />
                            </>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-base text-foreground">{signal.asset_pair}</span>
                            <Badge className="bg-black/40 border-primary/30 text-xs">
                              {signal.timeframe}
                            </Badge>
                            <Badge className={cn(
                              "text-xs font-bold shadow-lg",
                              signal.signal_type === 'CALL' 
                                ? 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-400 border-green-500/40' 
                                : 'bg-gradient-to-r from-red-500/30 to-red-600/30 text-red-400 border-red-500/40'
                            )}>
                              {signal.signal_type === 'CALL' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                              {signal.signal_type}
                            </Badge>
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                              signal.confidence >= 80 
                                ? 'bg-green-500/20 text-green-400' 
                                : signal.confidence >= 60 
                                ? 'bg-yellow-500/20 text-yellow-400' 
                                : 'bg-orange-500/20 text-orange-400'
                            )}>
                              <Zap className="h-3 w-3" />
                              {strength.label} {signal.confidence.toFixed(0)}%
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-xs">
                            <div className="flex items-center gap-4 text-muted-foreground/80">
                              <span>Entry: <span className="text-foreground font-semibold">{signal.entry_price.toFixed(5)}</span></span>
                              <span>Current: <span className="text-foreground font-semibold">{signal.current_price.toFixed(5)}</span></span>
                            </div>
                            <div className={cn(
                              "px-3 py-1 rounded-lg font-bold flex items-center gap-1",
                              isProfit 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            )}>
                              {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {isProfit ? '+' : ''}{pnl.toFixed(3)}%
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "relative text-2xl font-bold",
                          signal.expires_in < 10 
                            ? 'text-red-400 animate-pulse' 
                            : signal.expires_in < 30 
                            ? 'text-yellow-400' 
                            : 'text-foreground'
                        )}>
                          {signal.expires_in}s
                          {signal.expires_in < 10 && (
                            <div className="absolute inset-0 blur-xl bg-red-500/40" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground/60 uppercase tracking-wider">Expires</div>
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