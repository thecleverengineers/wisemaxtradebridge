import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  Shield,
  Zap,
  AlertCircle,
  BarChart3,
  Eye,
  Copy,
  CheckCircle2,
  XCircle,
  Timer,
  Award,
  Info
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TradingSignal {
  id: string;
  pair: string;
  signal_type: 'buy' | 'sell';
  entry_price: number;
  current_price: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  stop_loss: number;
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  risk_level: 'low' | 'medium' | 'high';
  timeframe: string;
  analysis: string;
  accuracy_rate: number;
  pnl_percentage: number;
  status: 'active' | 'hit_tp1' | 'hit_tp2' | 'hit_tp3' | 'stopped' | 'expired';
  created_at: string;
  expires_at: string;
  indicators: {
    rsi?: number;
    macd?: string;
    ma?: string;
    support?: number;
    resistance?: number;
    volume?: string;
  };
}

interface LiveTradingSignalsProps {
  onTradeClick?: (signalData: {
    pair: string;
    action: string;
    entry: string;
    takeProfit: string;
    stopLoss: string;
  }) => void;
}

const LiveTradingSignals: React.FC<LiveTradingSignalsProps> = ({ onTradeClick }) => {
  const { toast } = useToast();
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [copiedSignalId, setCopiedSignalId] = useState<string | null>(null);

  useEffect(() => {
    generateSignals();
    const interval = setInterval(updateSignals, 5000);
    return () => clearInterval(interval);
  }, []);

  const generateSignals = () => {
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'USD/CAD', 'NZD/USD', 'EUR/GBP'];
    const newSignals: TradingSignal[] = pairs.slice(0, 6).map((pair, index) => {
      const basePrice = 1.0000 + Math.random() * 0.5;
      const isLong = Math.random() > 0.5;
      const spread = basePrice * (0.01 + Math.random() * 0.02);
      
      return {
        id: `signal-${index}`,
        pair,
        signal_type: isLong ? 'buy' : 'sell',
        entry_price: basePrice,
        current_price: basePrice + (Math.random() - 0.5) * 0.001,
        take_profit_1: isLong ? basePrice + spread * 0.5 : basePrice - spread * 0.5,
        take_profit_2: isLong ? basePrice + spread * 1 : basePrice - spread * 1,
        take_profit_3: isLong ? basePrice + spread * 1.5 : basePrice - spread * 1.5,
        stop_loss: isLong ? basePrice - spread * 0.3 : basePrice + spread * 0.3,
        strength: ['weak', 'medium', 'strong', 'very_strong'][Math.floor(Math.random() * 4)] as any,
        risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        timeframe: ['M15', 'M30', 'H1', 'H4'][Math.floor(Math.random() * 4)],
        analysis: `Technical indicators suggest ${isLong ? 'bullish' : 'bearish'} momentum with ${Math.random() > 0.5 ? 'strong' : 'moderate'} volume`,
        accuracy_rate: 65 + Math.random() * 30,
        pnl_percentage: (Math.random() - 0.5) * 10,
        status: 'active',
        created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        expires_at: new Date(Date.now() + Math.random() * 7200000).toISOString(),
        indicators: {
          rsi: 30 + Math.random() * 40,
          macd: Math.random() > 0.5 ? 'Bullish Cross' : 'Bearish Cross',
          ma: Math.random() > 0.5 ? 'Above MA200' : 'Below MA200',
          support: basePrice - spread * 0.5,
          resistance: basePrice + spread * 0.5,
          volume: Math.random() > 0.5 ? 'High' : 'Normal'
        }
      };
    });
    
    setSignals(newSignals);
    if (newSignals.length > 0) {
      setSelectedSignal(newSignals[0]);
      generatePriceData(newSignals[0]);
    }
  };

  const updateSignals = () => {
    setSignals(prev => prev.map(signal => ({
      ...signal,
      current_price: signal.entry_price + (Math.random() - 0.5) * 0.002,
      pnl_percentage: ((signal.current_price - signal.entry_price) / signal.entry_price) * 100 * (signal.signal_type === 'buy' ? 1 : -1)
    })));
  };

  const generatePriceData = (signal: TradingSignal) => {
    const data = [];
    for (let i = 0; i < 50; i++) {
      data.push({
        time: i,
        price: signal.entry_price + (Math.random() - 0.5) * 0.005,
        ma20: signal.entry_price + (Math.random() - 0.5) * 0.003,
        ma50: signal.entry_price + (Math.random() - 0.5) * 0.002,
      });
    }
    setPriceData(data);
  };

  const copySignal = async (signal: TradingSignal) => {
    const text = `
📊 ${signal.pair} - ${signal.signal_type.toUpperCase()}
📍 Entry: ${signal.entry_price.toFixed(5)}
🎯 TP1: ${signal.take_profit_1.toFixed(5)}
🎯 TP2: ${signal.take_profit_2.toFixed(5)}
🎯 TP3: ${signal.take_profit_3.toFixed(5)}
🛑 SL: ${signal.stop_loss.toFixed(5)}
⏰ Timeframe: ${signal.timeframe}
💪 Strength: ${signal.strength}
⚠️ Risk: ${signal.risk_level}
    `.trim();
    
    await navigator.clipboard.writeText(text);
    setCopiedSignalId(signal.id);
    setTimeout(() => setCopiedSignalId(null), 2000);
    
    toast({
      title: "Signal Copied",
      description: "Trading signal copied to clipboard",
    });
  };

  const getStrengthColor = (strength: string) => {
    switch(strength) {
      case 'very_strong': return 'bg-gradient-to-r from-primary to-accent';
      case 'strong': return 'bg-gradient-to-r from-primary/80 to-accent/80';
      case 'medium': return 'bg-gradient-to-r from-secondary to-secondary/80';
      case 'weak': return 'bg-gradient-to-r from-muted to-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'low': return 'text-primary';
      case 'medium': return 'text-secondary';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Live Trading Signals</h2>
            <p className="text-muted-foreground">Professional signals with technical analysis</p>
          </div>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30">
          <span className="animate-pulse mr-2">●</span> Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signals List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Active Signals</CardTitle>
                <Badge className="bg-primary/20 text-primary">
                  {signals.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 p-4">
                  {signals.map((signal) => (
                    <div
                      key={signal.id}
                      onClick={() => {
                        setSelectedSignal(signal);
                        generatePriceData(signal);
                      }}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedSignal?.id === signal.id 
                          ? 'bg-primary/20 border border-primary/40' 
                          : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${
                            signal.signal_type === 'buy' 
                              ? 'bg-green-500/20' 
                              : 'bg-red-500/20'
                          }`}>
                            {signal.signal_type === 'buy' ? (
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold">{signal.pair}</span>
                            <Badge className="ml-2 text-xs" variant="outline">
                              {signal.timeframe}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            copySignal(signal);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          {copiedSignalId === signal.id ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Entry</span>
                          <span className="font-medium">
                            {signal.entry_price.toFixed(5)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">P&L</span>
                          <span className={`font-medium ${
                            signal.pnl_percentage > 0 ? 'text-primary' : 'text-destructive'
                          }`}>
                            {signal.pnl_percentage > 0 ? '+' : ''}{signal.pnl_percentage.toFixed(2)}%
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={`${getStrengthColor(signal.strength)} text-white border-0 text-xs`}>
                            {signal.strength.replace('_', ' ')}
                          </Badge>
                          <Shield className={`h-3.5 w-3.5 ${getRiskColor(signal.risk_level)}`} />
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        <Progress 
                          value={signal.accuracy_rate} 
                          className="h-1.5"
                        />
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Accuracy</span>
                          <span className="text-primary">{signal.accuracy_rate.toFixed(0)}%</span>
                        </div>

                        {/* Trade Button */}
                        {onTradeClick && (
                          <Button
                            size="sm"
                            className="w-full mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTradeClick({
                                pair: signal.pair,
                                action: signal.signal_type.toUpperCase(),
                                entry: signal.entry_price.toFixed(5),
                                takeProfit: signal.take_profit_1.toFixed(5),
                                stopLoss: signal.stop_loss.toFixed(5),
                              });
                            }}
                          >
                            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                            Trade
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Signal Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSignal && (
            <>
              {/* Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedSignal.signal_type === 'buy' 
                          ? 'bg-primary/20' 
                          : 'bg-destructive/20'
                      }`}>
                        {selectedSignal.signal_type === 'buy' ? (
                          <ArrowUpRight className="h-5 w-5 text-primary" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedSignal.pair} - {selectedSignal.signal_type.toUpperCase()}
                        </h3>
                        <p className="text-sm text-muted-foreground">{selectedSignal.timeframe} Chart</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Timer className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={priceData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis domain={['dataMin - 0.001', 'dataMax + 0.001']} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                        labelStyle={{ color: '#cbd5e1' }}
                      />
                      <ReferenceLine y={selectedSignal.entry_price} stroke="#fbbf24" strokeDasharray="5 5" />
                      <ReferenceLine y={selectedSignal.take_profit_1} stroke="#10b981" strokeDasharray="3 3" />
                      <ReferenceLine y={selectedSignal.stop_loss} stroke="#ef4444" strokeDasharray="3 3" />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                      <Line type="monotone" dataKey="ma20" stroke="#3b82f6" strokeWidth={1} dot={false} />
                      <Line type="monotone" dataKey="ma50" stroke="#f59e0b" strokeWidth={1} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Signal Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Targets & Levels */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Targets & Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Take Profit 1</span>
                        </div>
                        <span className="font-semibold text-primary">
                          {selectedSignal.take_profit_1.toFixed(5)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Take Profit 2</span>
                        </div>
                        <span className="font-semibold text-primary">
                          {selectedSignal.take_profit_2.toFixed(5)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Take Profit 3</span>
                        </div>
                        <span className="font-semibold text-primary">
                          {selectedSignal.take_profit_3.toFixed(5)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-muted-foreground">Stop Loss</span>
                        </div>
                        <span className="font-semibold text-destructive">
                          {selectedSignal.stop_loss.toFixed(5)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Indicators */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Technical Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {selectedSignal.indicators.rsi && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">RSI</span>
                          <div className="flex items-center gap-2">
                            <Progress value={selectedSignal.indicators.rsi} className="w-20 h-2" />
                            <span className={`text-sm font-medium ${
                              selectedSignal.indicators.rsi > 70 ? 'text-destructive' :
                              selectedSignal.indicators.rsi < 30 ? 'text-primary' :
                              'text-secondary'
                            }`}>
                              {selectedSignal.indicators.rsi.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {selectedSignal.indicators.macd && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">MACD</span>
                          <Badge className={`${
                            selectedSignal.indicators.macd.includes('Bullish') 
                              ? 'bg-primary/20 text-primary border-primary/30' 
                              : 'bg-destructive/20 text-destructive border-destructive/30'
                          }`}>
                            {selectedSignal.indicators.macd}
                          </Badge>
                        </div>
                      )}
                      
                      {selectedSignal.indicators.ma && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Moving Average</span>
                          <Badge variant="outline">
                            {selectedSignal.indicators.ma}
                          </Badge>
                        </div>
                      )}
                      
                      {selectedSignal.indicators.volume && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Volume</span>
                          <Badge className={`${
                            selectedSignal.indicators.volume === 'High' 
                              ? 'bg-primary/20 text-primary border-primary/30' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {selectedSignal.indicators.volume}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-primary mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            {selectedSignal.analysis}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTradingSignals;