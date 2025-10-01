import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertCircle, BarChart3, Zap, Clock, ChevronUp, ChevronDown, Signal, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar, Cell } from 'recharts';

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

interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20: number;
  ma50: number;
  ma200: number;
  signal?: 'CALL' | 'PUT';
  confidence?: number;
}

export function LiveTradingSignals() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(1.2000);
  const [priceChange, setPriceChange] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');

  // Generate realistic candlestick data
  const generateCandleData = (basePrice: number, count: number): CandleData[] => {
    const data: CandleData[] = [];
    let currentBasePrice = basePrice;
    
    for (let i = count; i >= 0; i--) {
      const timestamp = Date.now() - i * 60000;
      const open = currentBasePrice + (Math.random() - 0.5) * 0.002;
      const close = open + (Math.random() - 0.5) * 0.003;
      const high = Math.max(open, close) + Math.random() * 0.001;
      const low = Math.min(open, close) - Math.random() * 0.001;
      const volume = 100000 + Math.random() * 500000;
      
      // Calculate moving averages
      const ma20 = currentBasePrice + (Math.random() - 0.5) * 0.001;
      const ma50 = currentBasePrice + (Math.random() - 0.5) * 0.002;
      const ma200 = currentBasePrice + (Math.random() - 0.5) * 0.003;
      
      // Occasionally add signals
      const shouldAddSignal = Math.random() > 0.92;
      if (shouldAddSignal) {
        data.push({
          time: new Date(timestamp).toLocaleTimeString('en-US', { hour12: false }),
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          ma20,
          ma50,
          ma200,
          signal: Math.random() > 0.5 ? 'CALL' : 'PUT',
          confidence: 60 + Math.random() * 40
        });
      } else {
        data.push({
          time: new Date(timestamp).toLocaleTimeString('en-US', { hour12: false }),
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          ma20,
          ma50,
          ma200
        });
      }
      
      currentBasePrice = close;
    }
    
    return data;
  };

  // Generate realistic trading signal
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
        name: 'MACD',
        value: macd,
        signal: macd > 0 ? 'BUY' : 'SELL'
      },
      {
        name: 'BB(20)',
        value: bb,
        signal: bb > 1 ? 'SELL' : bb < -1 ? 'BUY' : 'NEUTRAL'
      },
      {
        name: 'Stoch',
        value: stoch,
        signal: stoch > 80 ? 'SELL' : stoch < 20 ? 'BUY' : 'NEUTRAL'
      },
      {
        name: 'EMA(50)',
        value: ema,
        signal: basePrice > ema ? 'BUY' : 'SELL'
      }
    ];
    
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
      expires_in: 30 + Math.floor(Math.random() * 90)
    };
  };

  // Initialize data
  useEffect(() => {
    const initialData = generateCandleData(1.2000, 50);
    setCandleData(initialData);
    const lastCandle = initialData[initialData.length - 1];
    setCurrentPrice(lastCandle.close);
    setPriceChange(((lastCandle.close - initialData[0].open) / initialData[0].open) * 100);
    
    const initialSignals = Array.from({ length: 3 }, generateSignal);
    setSignals(initialSignals);
  }, []);

  // Update data in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Update candle data
      setCandleData(prev => {
        if (prev.length === 0) return prev;
        
        const newData = [...prev];
        const lastCandle = { ...newData[newData.length - 1] };
        
        // Update last candle
        lastCandle.close = lastCandle.close + (Math.random() - 0.5) * 0.0002;
        lastCandle.high = Math.max(lastCandle.high, lastCandle.close);
        lastCandle.low = Math.min(lastCandle.low, lastCandle.close);
        lastCandle.volume = lastCandle.volume + Math.random() * 1000;
        lastCandle.time = new Date().toLocaleTimeString('en-US', { hour12: false });
        
        newData[newData.length - 1] = lastCandle;
        
        setCurrentPrice(lastCandle.close);
        setPriceChange(((lastCandle.close - newData[0].open) / newData[0].open) * 100);
        
        // Add new candle every minute
        if (Date.now() - lastCandle.timestamp > 60000) {
          if (newData.length > 50) {
            newData.shift();
          }
          
          const newCandle: CandleData = {
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            timestamp: Date.now(),
            open: lastCandle.close,
            high: lastCandle.close + Math.random() * 0.001,
            low: lastCandle.close - Math.random() * 0.001,
            close: lastCandle.close + (Math.random() - 0.5) * 0.002,
            volume: 100000 + Math.random() * 500000,
            ma20: lastCandle.close + (Math.random() - 0.5) * 0.001,
            ma50: lastCandle.close + (Math.random() - 0.5) * 0.002,
            ma200: lastCandle.close + (Math.random() - 0.5) * 0.003
          };
          
          newData.push(newCandle);
        }
        
        return newData;
      });
      
      // Update signals
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const candle = payload[0].payload;
      return (
        <div className="bg-blue-950/95 backdrop-blur border border-blue-700 rounded p-2 shadow-xl">
          <p className="text-xs text-blue-300 mb-1">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-blue-400">O:</span>
              <span className="text-blue-100">{candle.open?.toFixed(5)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-blue-400">H:</span>
              <span className="text-blue-100">{candle.high?.toFixed(5)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-blue-400">L:</span>
              <span className="text-blue-100">{candle.low?.toFixed(5)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-blue-400">C:</span>
              <span className={candle.close > candle.open ? 'text-green-400' : 'text-red-400'}>
                {candle.close?.toFixed(5)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-blue-400">Vol:</span>
              <span className="text-blue-100">{(candle.volume / 1000).toFixed(0)}K</span>
            </div>
          </div>
          {candle.signal && (
            <div className="mt-2 pt-2 border-t border-blue-700">
              <Badge className={cn(
                "text-xs",
                candle.signal === 'CALL' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              )}>
                {candle.signal} {candle.confidence?.toFixed(0)}%
              </Badge>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomizedCandle = (props: any) => {
    const { x, y, width, height, payload } = props;
    const isGreen = payload.close >= payload.open;
    
    return (
      <g>
        {/* Candle wick */}
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y + height}
          stroke={isGreen ? '#10b981' : '#ef4444'}
          strokeWidth={1}
        />
        {/* Candle body */}
        <rect
          x={x}
          y={y + (isGreen ? height * ((payload.high - payload.close) / (payload.high - payload.low)) : height * ((payload.high - payload.open) / (payload.high - payload.low)))}
          width={width}
          height={Math.abs(height * ((payload.close - payload.open) / (payload.high - payload.low)))}
          fill={isGreen ? '#10b981' : '#ef4444'}
          fillOpacity={0.8}
        />
      </g>
    );
  };

  return (
    <div className="space-y-4 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 rounded-xl p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/50 via-blue-800/50 to-blue-900/50 rounded-lg p-4 border border-blue-700/30 backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-blue-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
              Live Trading Signals
            </h2>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <span className="animate-pulse mr-1">●</span>
              LIVE
            </Badge>
          </div>
          <button className="text-blue-300 hover:text-blue-100 transition-colors">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="bg-blue-900/50 border border-blue-700/50 rounded px-3 py-1.5 text-sm text-blue-100 focus:outline-none focus:border-cyan-400"
            >
              <option value="EUR/USD">EUR/USD</option>
              <option value="GBP/USD">GBP/USD</option>
              <option value="USD/JPY">USD/JPY</option>
              <option value="AUD/USD">AUD/USD</option>
              <option value="USD/CAD">USD/CAD</option>
              <option value="EUR/GBP">EUR/GBP</option>
            </select>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-100">{currentPrice.toFixed(5)}</span>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded",
                priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              )}>
                {priceChange >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="text-sm font-semibold">{Math.abs(priceChange).toFixed(2)}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {['1m', '5m', '15m', '30m', '1h'].map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-all",
                  selectedTimeframe === tf
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-blue-300 hover:text-blue-100 hover:bg-blue-800/50'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 rounded-lg border border-blue-700/30 p-4">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={candleData}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" opacity={0.2} />
            <XAxis 
              dataKey="time" 
              stroke="#60a5fa"
              fontSize={10}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="price"
              orientation="right"
              stroke="#60a5fa"
              fontSize={10}
              domain={['dataMin - 0.002', 'dataMax + 0.002']}
              tickFormatter={(value) => value.toFixed(4)}
            />
            <YAxis 
              yAxisId="volume"
              orientation="left"
              stroke="#60a5fa"
              fontSize={10}
              domain={[0, 'dataMax']}
              hide
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Volume bars */}
            <Bar 
              yAxisId="volume"
              dataKey="volume" 
              fill="url(#volumeGradient)"
              opacity={0.3}
            />
            
            {/* Moving averages */}
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="ma20" 
              stroke="#fbbf24" 
              strokeWidth={1}
              dot={false}
              strokeDasharray="2 2"
            />
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="ma50" 
              stroke="#3b82f6" 
              strokeWidth={1}
              dot={false}
            />
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="ma200" 
              stroke="#8b5cf6" 
              strokeWidth={1}
              dot={false}
            />
            
            {/* Candlesticks */}
            {candleData.map((candle, index) => {
              const isGreen = candle.close >= candle.open;
              return (
                <ReferenceLine
                  key={index}
                  yAxisId="price"
                  segment={[
                    { x: candle.time, y: candle.low },
                    { x: candle.time, y: candle.high }
                  ]}
                  stroke={isGreen ? '#10b981' : '#ef4444'}
                  strokeWidth={1}
                />
              );
            })}
            
            {/* Signal markers */}
            {candleData.filter(d => d.signal).map((entry, index) => (
              <ReferenceLine
                key={`signal-${index}`}
                yAxisId="price"
                y={entry.close}
                stroke={entry.signal === 'CALL' ? '#10b981' : '#ef4444'}
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Indicator legend */}
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-yellow-500"></div>
            <span className="text-xs text-blue-300">MA(20)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-xs text-blue-300">MA(50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-500"></div>
            <span className="text-xs text-blue-300">MA(200)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-cyan-500/30"></div>
            <span className="text-xs text-blue-300">Volume</span>
          </div>
        </div>
      </div>

      {/* Active Signals */}
      <div className="grid gap-3">
        <h3 className="text-sm font-semibold text-blue-200 flex items-center gap-2">
          <Signal className="h-4 w-4 text-cyan-400" />
          Active Signals ({signals.length})
        </h3>
        
        <div className="grid gap-2">
          {signals.map((signal) => {
            const pnl = ((signal.current_price - signal.entry_price) / signal.entry_price) * 100;
            const isProfit = signal.signal_type === 'CALL' ? pnl > 0 : pnl < 0;
            
            return (
              <div key={signal.id} className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-3 hover:border-blue-600 transition-colors backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded",
                      signal.signal_type === 'CALL' ? 'bg-green-500/10' : 'bg-red-500/10'
                    )}>
                      {signal.signal_type === 'CALL' ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-100">{signal.asset_pair}</span>
                        <Badge className="bg-blue-800/50 text-blue-300 text-xs h-5 border-blue-700">
                          {signal.timeframe}
                        </Badge>
                        <Badge className={cn(
                          "text-xs h-5",
                          signal.signal_type === 'CALL' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        )}>
                          {signal.signal_type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1 h-3 rounded-full",
                                i < Math.ceil(signal.confidence / 20)
                                  ? signal.confidence >= 80 ? 'bg-green-400' : signal.confidence >= 60 ? 'bg-yellow-400' : 'bg-orange-400'
                                  : 'bg-blue-800'
                              )}
                            />
                          ))}
                          <span className="text-xs text-blue-300 ml-1">{signal.confidence.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-blue-400">
                        <span>Entry: {signal.entry_price.toFixed(5)}</span>
                        <span>Current: {signal.current_price.toFixed(5)}</span>
                        <span className={cn(
                          "font-semibold",
                          isProfit ? 'text-green-400' : 'text-red-400'
                        )}>
                          {isProfit ? '+' : ''}{pnl.toFixed(3)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-lg font-bold",
                      signal.expires_in < 10 ? 'text-red-400 animate-pulse' : 'text-blue-100'
                    )}>
                      {signal.expires_in}s
                    </div>
                    <div className="text-xs text-blue-400">expires</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}