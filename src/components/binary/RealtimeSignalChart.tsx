import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Signal {
  id: string;
  time: Date;
  price: number;
  type: 'CALL' | 'PUT';
  strength: 'strong' | 'medium' | 'weak';
  asset: string;
}

interface RealtimeSignalChartProps {
  assetPair: string;
  onSignalGenerated?: (signal: Signal) => void;
}

export function RealtimeSignalChart({ assetPair, onSignalGenerated }: RealtimeSignalChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priceData, setPriceData] = useState<number[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [latestSignal, setLatestSignal] = useState<Signal | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const intervalRef = useRef<NodeJS.Timeout>();

  // Generate initial price based on asset pair
  const getInitialPrice = (pair: string) => {
    const basePrices: Record<string, number> = {
      'EUR/USD': 1.0850,
      'GBP/USD': 1.2650,
      'USD/JPY': 149.50,
      'AUD/USD': 0.6450,
      'USD/CAD': 1.3550,
      'EUR/GBP': 0.8575
    };
    return basePrices[pair] || 1.0000;
  };

  // Generate realistic price movement
  const generatePriceMovement = (lastPrice: number, volatility: number = 0.0002) => {
    const change = (Math.random() - 0.5) * 2 * volatility;
    const momentum = Math.random() > 0.7 ? (Math.random() - 0.5) * volatility * 2 : 0;
    return lastPrice * (1 + change + momentum);
  };

  // Calculate technical indicators
  const calculateSignal = (prices: number[]) => {
    if (prices.length < 5) return null;

    const recentPrices = prices.slice(-20);
    const sma5 = recentPrices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const sma10 = recentPrices.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, recentPrices.length);
    
    const currentPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2];
    const priceChange = currentPrice - previousPrice;
    const changePercent = (priceChange / previousPrice) * 100;

    // RSI calculation (simplified)
    const gains = [];
    const losses = [];
    for (let i = 1; i < recentPrices.length; i++) {
      const diff = recentPrices[i] - recentPrices[i - 1];
      if (diff > 0) gains.push(diff);
      else losses.push(Math.abs(diff));
    }
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0.0001;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    // Generate signal based on indicators
    const shouldGenerateSignal = Math.random() < 0.15; // 15% chance per update
    if (!shouldGenerateSignal) return null;

    let signalType: 'CALL' | 'PUT';
    let strength: 'strong' | 'medium' | 'weak';

    // Determine signal type
    if (sma5 > sma10 && rsi < 70) {
      signalType = 'CALL';
    } else if (sma5 < sma10 && rsi > 30) {
      signalType = 'PUT';
    } else {
      signalType = Math.random() > 0.5 ? 'CALL' : 'PUT';
    }

    // Determine signal strength
    const momentum = Math.abs(changePercent);
    if (momentum > 0.03 && ((signalType === 'CALL' && rsi < 30) || (signalType === 'PUT' && rsi > 70))) {
      strength = 'strong';
    } else if (momentum > 0.02) {
      strength = 'medium';
    } else {
      strength = 'weak';
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date(),
      price: currentPrice,
      type: signalType,
      strength,
      asset: assetPair
    };
  };

  // Draw chart on canvas
  const drawChart = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || priceData.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set dimensions
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Find min and max prices
    const minPrice = Math.min(...priceData);
    const maxPrice = Math.max(...priceData);
    const priceRange = maxPrice - minPrice || 0.0001;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw price line
    ctx.strokeStyle = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    priceData.forEach((price, i) => {
      const x = padding + (chartWidth / (priceData.length - 1)) * i;
      const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
    gradient.addColorStop(0, trend === 'up' ? 'rgba(34, 197, 94, 0.3)' : trend === 'down' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    priceData.forEach((price, i) => {
      const x = padding + (chartWidth / (priceData.length - 1)) * i;
      const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw signal indicator if present
    if (latestSignal && Date.now() - latestSignal.time.getTime() < 5000) {
      const signalIndex = priceData.length - 1;
      const x = padding + (chartWidth / (priceData.length - 1)) * signalIndex;
      const y = padding + chartHeight - ((latestSignal.price - minPrice) / priceRange) * chartHeight;

      ctx.fillStyle = latestSignal.type === 'CALL' ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw arrow
      ctx.strokeStyle = latestSignal.type === 'CALL' ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (latestSignal.type === 'CALL') {
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x, y - 20);
        ctx.lineTo(x - 5, y - 15);
        ctx.moveTo(x, y - 20);
        ctx.lineTo(x + 5, y - 15);
      } else {
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x, y + 20);
        ctx.lineTo(x - 5, y + 15);
        ctx.moveTo(x, y + 20);
        ctx.lineTo(x + 5, y + 15);
      }
      ctx.stroke();
    }
    } catch (error) {
      console.error('Error drawing chart:', error);
    }
  };

  useEffect(() => {
    const initialPrice = getInitialPrice(assetPair);
    const initialData: number[] = [];
    
    // Build the initial data array properly
    for (let i = 0; i < 30; i++) {
      if (i === 0) {
        initialData.push(initialPrice);
      } else {
        initialData.push(generatePriceMovement(initialData[i - 1]));
      }
    }
    
    setPriceData(initialData);
    setCurrentPrice(initialData[initialData.length - 1]);

    intervalRef.current = setInterval(() => {
      setPriceData(prev => {
        const newPrice = generatePriceMovement(prev[prev.length - 1]);
        const newData = [...prev.slice(1), newPrice];
        
        // Check for signal generation
        const signal = calculateSignal(newData);
        if (signal) {
          setLatestSignal(signal);
          onSignalGenerated?.(signal);
        }

        // Update trend
        const avg5 = newData.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const avg10 = newData.slice(-10).reduce((a, b) => a + b, 0) / 10;
        setTrend(avg5 > avg10 ? 'up' : avg5 < avg10 ? 'down' : 'neutral');

        setCurrentPrice(newPrice);
        return newData;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [assetPair]);

  useEffect(() => {
    drawChart();
  }, [priceData, latestSignal, trend]);

  const priceChange = priceData.length > 1 ? currentPrice - priceData[priceData.length - 2] : 0;
  const priceChangePercent = priceData.length > 1 ? (priceChange / priceData[priceData.length - 2]) * 100 : 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{assetPair}</CardTitle>
          <div className="flex items-center gap-2">
            {latestSignal && Date.now() - latestSignal.time.getTime() < 5000 && (
              <Badge 
                variant={latestSignal.strength === 'strong' ? 'default' : latestSignal.strength === 'medium' ? 'secondary' : 'outline'}
                className={cn(
                  "animate-pulse",
                  latestSignal.type === 'CALL' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                )}
              >
                {latestSignal.type} - {latestSignal.strength}
              </Badge>
            )}
            <Activity className="h-4 w-4 text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-2xl font-bold text-foreground">
            {currentPrice.toFixed(5)}
          </span>
          <div className={cn(
            "flex items-center gap-1",
            priceChange >= 0 ? "text-green-500" : "text-red-500"
          )}>
            {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(5)} ({priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={200} 
          className="w-full h-[200px]"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </CardContent>
    </Card>
  );
}