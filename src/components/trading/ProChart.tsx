import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Activity, Maximize2, Settings, Download, Share2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const timeframes = [
  { value: '1m', label: '1M' },
  { value: '5m', label: '5M' },
  { value: '15m', label: '15M' },
  { value: '30m', label: '30M' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
];

const chartTypes = [
  { value: 'candle', label: 'Candlestick' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'bar', label: 'Bar' },
];

const indicators = [
  { value: 'ma', label: 'Moving Average' },
  { value: 'ema', label: 'EMA' },
  { value: 'rsi', label: 'RSI' },
  { value: 'macd', label: 'MACD' },
  { value: 'bb', label: 'Bollinger Bands' },
  { value: 'volume', label: 'Volume' },
];

export function ProChart({ symbol = 'BTCUSD' }: { symbol?: string }) {
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState('candle');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['ma', 'volume']);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate sample data
  const generateChartData = () => {
    const labels = [];
    const data = [];
    const volumeData = [];
    
    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setHours(date.getHours() - (50 - i));
      labels.push(date.toLocaleTimeString());
      data.push(42000 + Math.random() * 2000);
      volumeData.push(Math.random() * 1000000);
    }

    return {
      labels,
      datasets: [
        {
          label: symbol,
          data,
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(147, 51, 234, 0.5)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
      },
      y: {
        position: 'right' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <Card className="bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20 h-full">
      {/* Chart Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div>
              <div className="text-2xl font-bold">{symbol}</div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">$43,567.89</span>
                <span className="text-green-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.34%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center space-x-4">
          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1">
            {timeframes.map(tf => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeframe(tf.value)}
                className="px-2 py-1 h-7"
              >
                {tf.label}
              </Button>
            ))}
          </div>

          {/* Chart Type */}
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chartTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Indicators */}
          <Select value={selectedIndicators[0]} onValueChange={(value) => setSelectedIndicators([value])}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue placeholder="Indicators" />
            </SelectTrigger>
            <SelectContent>
              {indicators.map(ind => (
                <SelectItem key={ind.value} value={ind.value}>
                  {ind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4" style={{ height: 'calc(100% - 140px)' }}>
        <div className="h-full bg-background/30 rounded-lg p-4">
          <Line data={generateChartData()} options={options} />
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>O: 42,123.45</span>
            <span>H: 43,678.90</span>
            <span>L: 41,234.56</span>
            <span>C: 43,567.89</span>
            <span>V: 1.23M</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </Card>
  );
}