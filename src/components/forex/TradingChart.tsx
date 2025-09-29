import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Activity, BarChart3, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  sma50?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  bollinger_upper?: number;
  bollinger_lower?: number;
  bollinger_middle?: number;
}

interface TradingChartProps {
  pairSymbol: string;
  currentPrice: number;
  data?: ChartData[];
  onTimeframeChange?: (timeframe: string) => void;
}

export function TradingChart({ pairSymbol, currentPrice, data = [], onTimeframeChange }: TradingChartProps) {
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  const [timeframe, setTimeframe] = useState('1H');
  const [indicators, setIndicators] = useState<string[]>(['SMA20', 'RSI']);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Generate mock data if not provided
  const chartData = data.length > 0 ? data : generateMockData();

  function generateMockData(): ChartData[] {
    const mockData: ChartData[] = [];
    const now = Date.now();
    const basePrice = currentPrice;

    for (let i = 59; i >= 0; i--) {
      const time = new Date(now - i * 60000);
      const randomWalk = (Math.random() - 0.5) * 0.002;
      const price = basePrice * (1 + randomWalk * (60 - i) / 10);
      
      mockData.push({
        time: format(time, 'HH:mm'),
        open: price * (1 + (Math.random() - 0.5) * 0.001),
        high: price * (1 + Math.random() * 0.002),
        low: price * (1 - Math.random() * 0.002),
        close: price,
        volume: Math.random() * 1000000,
        sma20: price * (1 + (Math.random() - 0.5) * 0.001),
        sma50: price * (1 + (Math.random() - 0.5) * 0.002),
        rsi: 30 + Math.random() * 40,
        macd: (Math.random() - 0.5) * 0.001,
        signal: (Math.random() - 0.5) * 0.0005,
        bollinger_upper: price * 1.002,
        bollinger_lower: price * 0.998,
        bollinger_middle: price
      });
    }

    return mockData;
  }

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    if (onTimeframeChange) {
      onTimeframeChange(value);
    }
  };

  const toggleIndicator = (indicator: string) => {
    setIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={isFullscreen ? "100%" : 400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={['dataMin', 'dataMax']} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              {indicators.includes('SMA20') && (
                <Line 
                  type="monotone" 
                  dataKey="sma20" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
              )}
              {indicators.includes('SMA50') && (
                <Line 
                  type="monotone" 
                  dataKey="sma50" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
              )}
              {indicators.includes('Bollinger') && (
                <>
                  <Line type="monotone" dataKey="bollinger_upper" stroke="hsl(var(--chart-4))" strokeWidth={1} dot={false} opacity={0.5} />
                  <Line type="monotone" dataKey="bollinger_middle" stroke="hsl(var(--chart-4))" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="bollinger_lower" stroke="hsl(var(--chart-4))" strokeWidth={1} dot={false} opacity={0.5} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={isFullscreen ? "100%" : 400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={['dataMin', 'dataMax']} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        // Candlestick chart using custom rendering
        return (
          <ResponsiveContainer width="100%" height={isFullscreen ? "100%" : 400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={['dataMin', 'dataMax']} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-2 bg-background border rounded">
                        <p className="text-sm">Time: {data.time}</p>
                        <p className="text-sm">Open: {data.open.toFixed(5)}</p>
                        <p className="text-sm">High: {data.high.toFixed(5)}</p>
                        <p className="text-sm">Low: {data.low.toFixed(5)}</p>
                        <p className="text-sm">Close: {data.close.toFixed(5)}</p>
                        <p className="text-sm">Volume: {data.volume.toFixed(0)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="high" stroke="hsl(var(--chart-1))" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="low" stroke="hsl(var(--chart-2))" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderRSI = () => {
    if (!indicators.includes('RSI')) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">RSI</h4>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
            <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="hsl(var(--success))" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="rsi" 
              stroke="hsl(var(--primary))" 
              strokeWidth={1}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderMACD = () => {
    if (!indicators.includes('MACD')) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">MACD</h4>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" hide />
            <YAxis domain={['dataMin', 'dataMax']} stroke="hsl(var(--muted-foreground))" />
            <Line 
              type="monotone" 
              dataKey="macd" 
              stroke="hsl(var(--primary))" 
              strokeWidth={1}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="signal" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className={cn("relative", isFullscreen && "fixed inset-0 z-50 rounded-none")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {pairSymbol} Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1M">1M</SelectItem>
                <SelectItem value="5M">5M</SelectItem>
                <SelectItem value="15M">15M</SelectItem>
                <SelectItem value="30M">30M</SelectItem>
                <SelectItem value="1H">1H</SelectItem>
                <SelectItem value="4H">4H</SelectItem>
                <SelectItem value="1D">1D</SelectItem>
                <SelectItem value="1W">1W</SelectItem>
              </SelectContent>
            </Select>

            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="candlestick">Candlestick</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {['SMA20', 'SMA50', 'RSI', 'MACD', 'Bollinger'].map(indicator => (
            <Badge 
              key={indicator}
              variant={indicators.includes(indicator) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleIndicator(indicator)}
            >
              {indicator}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent ref={chartRef}>
        {renderChart()}
        {renderRSI()}
        {renderMACD()}
      </CardContent>
    </Card>
  );
}