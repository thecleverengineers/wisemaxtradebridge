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

const LiveTradingSignals: React.FC = () => {
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
      case 'very_strong': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'strong': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'medium': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'weak': return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Live Trading Signals</h2>
            <p className="text-purple-300">Professional signals with technical analysis</p>
          </div>
        </div>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <span className="animate-pulse mr-2">●</span> Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signals List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Active Signals</CardTitle>
                <Badge className="bg-purple-500/20 text-purple-300">
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
                          ? 'bg-purple-500/20 border border-purple-500/40' 
                          : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
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
                            <span className="font-semibold text-white">{signal.pair}</span>
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
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-purple-300" />
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Entry</span>
                          <span className="text-white font-medium">
                            {signal.entry_price.toFixed(5)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">P&L</span>
                          <span className={`font-medium ${
                            signal.pnl_percentage > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {signal.pnl_percentage > 0 ? '+' : ''}{signal.pnl_percentage.toFixed(2)}%
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={`${getStrengthColor(signal.strength)} text-white border-0 text-xs`}>
                            {signal.strength.replace('_', ' ')}
                          </Badge>
                          <Shield className={`h-3.5 w-3.5 ${getRiskColor(signal.risk_level)}`} />
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        <Progress 
                          value={signal.accuracy_rate} 
                          className="h-1.5 bg-slate-600"
                        />
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Accuracy</span>
                          <span className="text-purple-300">{signal.accuracy_rate.toFixed(0)}%</span>
                        </div>
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
              <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedSignal.signal_type === 'buy' 
                          ? 'bg-green-500/20' 
                          : 'bg-red-500/20'
                      }`}>
                        {selectedSignal.signal_type === 'buy' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-400" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {selectedSignal.pair} - {selectedSignal.signal_type.toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-400">{selectedSignal.timeframe} Chart</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-purple-300">
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
                <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-400" />
                      Targets & Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-gray-300">Take Profit 1</span>
                        </div>
                        <span className="font-semibold text-green-400">
                          {selectedSignal.take_profit_1.toFixed(5)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-gray-300">Take Profit 2</span>
                        </div>
                        <span className="font-semibold text-green-400">
                          {selectedSignal.take_profit_2.toFixed(5)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-gray-300">Take Profit 3</span>
                        </div>
                        <span className="font-semibold text-green-400">
                          {selectedSignal.take_profit_3.toFixed(5)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-400" />
                          <span className="text-sm text-gray-300">Stop Loss</span>
                        </div>
                        <span className="font-semibold text-red-400">
                          {selectedSignal.stop_loss.toFixed(5)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Indicators */}
                <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-400" />
                      Technical Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {selectedSignal.indicators.rsi && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">RSI</span>
                          <div className="flex items-center gap-2">
                            <Progress value={selectedSignal.indicators.rsi} className="w-20 h-2" />
                            <span className={`text-sm font-medium ${
                              selectedSignal.indicators.rsi > 70 ? 'text-red-400' :
                              selectedSignal.indicators.rsi < 30 ? 'text-green-400' :
                              'text-yellow-400'
                            }`}>
                              {selectedSignal.indicators.rsi.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {selectedSignal.indicators.macd && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">MACD</span>
                          <Badge className={`${
                            selectedSignal.indicators.macd.includes('Bullish') 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                            {selectedSignal.indicators.macd}
                          </Badge>
                        </div>
                      )}
                      
                      {selectedSignal.indicators.ma && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Moving Average</span>
                          <Badge variant="outline" className="text-purple-300">
                            {selectedSignal.indicators.ma}
                          </Badge>
                        </div>
                      )}
                      
                      {selectedSignal.indicators.volume && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Volume</span>
                          <Badge className={`${
                            selectedSignal.indicators.volume === 'High' 
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>
                            {selectedSignal.indicators.volume}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-slate-700">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-purple-400 mt-0.5" />
                          <p className="text-xs text-gray-400">
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