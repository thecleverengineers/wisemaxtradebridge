import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ColorType, LineStyle, CrosshairMode, ISeriesApi } from 'lightweight-charts';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import { ChartSignalMarkers } from './ChartSignalMarkers';
import { SignalOverlay } from './SignalOverlay';
import { TradeZones } from './TradeZones';
import { ChartControls } from './ChartControls';

interface PriceChartProps {
  asset: any;
  timeframe: any;
  signals?: any[];
  activeTrades?: any[];
  onSignalClick?: (signal: any) => void;
}

export const PriceChart: React.FC<PriceChartProps> = ({ 
  asset, 
  timeframe, 
  signals = [], 
  activeTrades = [],
  onSignalClick 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | null>(null);
  const [hoveredSignal, setHoveredSignal] = useState<any>(null);
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !asset) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#e4e4e7' : '#27272a',
      },
      grid: {
        vertLines: { 
          color: isDark ? 'rgba(39, 39, 42, 0.5)' : 'rgba(228, 228, 231, 0.5)',
          style: LineStyle.Dotted,
        },
        horzLines: { 
          color: isDark ? 'rgba(39, 39, 42, 0.5)' : 'rgba(228, 228, 231, 0.5)',
          style: LineStyle.Dotted,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: isDark ? '#71717a' : '#a1a1aa',
          style: LineStyle.Dashed,
        },
        horzLine: {
          width: 1,
          color: isDark ? '#71717a' : '#a1a1aa',
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: timeframe?.duration_seconds <= 60,
      },
    });

    chartRef.current = chart;

    // Create series based on timeframe
    if (timeframe?.duration_seconds <= 60 || chartType === 'line') {
      const lineSeries = chart.addLineSeries({
        color: isDark ? '#22c55e' : '#16a34a',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      });
      seriesRef.current = lineSeries as any;
    } else {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      });
      seriesRef.current = candlestickSeries as any;
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [asset, timeframe, isDark, chartType]);

  // Generate and update price data
  useEffect(() => {
    if (!seriesRef.current || !asset) return;

    const generateInitialData = () => {
      const data = [];
      const now = Math.floor(Date.now() / 1000);
      const basePrice = asset.current_price;
      
      for (let i = 100; i >= 0; i--) {
        const time = now - i * (timeframe?.duration_seconds || 60);
        const variation = (Math.random() - 0.5) * basePrice * 0.002;
        
        if (chartType === 'line' || timeframe?.duration_seconds <= 60) {
          data.push({
            time,
            value: basePrice + variation,
          });
        } else {
          const open = basePrice + (Math.random() - 0.5) * basePrice * 0.002;
          const close = open + (Math.random() - 0.5) * basePrice * 0.002;
          const high = Math.max(open, close) + Math.random() * basePrice * 0.001;
          const low = Math.min(open, close) - Math.random() * basePrice * 0.001;
          
          data.push({
            time,
            open,
            high,
            low,
            close,
          });
        }
      }
      
      seriesRef.current?.setData(data as any);
    };

    generateInitialData();

    // Real-time updates
    const interval = setInterval(() => {
      if (!seriesRef.current) return;
      
      const now = Math.floor(Date.now() / 1000);
      const lastPrice = asset.current_price + (Math.random() - 0.5) * asset.current_price * 0.001;
      
      if (chartType === 'line' || timeframe?.duration_seconds <= 60) {
        seriesRef.current.update({
          time: now,
          value: lastPrice,
        } as any);
      } else {
        const open = lastPrice;
        const close = open + (Math.random() - 0.5) * asset.current_price * 0.001;
        const high = Math.max(open, close) + Math.random() * asset.current_price * 0.0005;
        const low = Math.min(open, close) - Math.random() * asset.current_price * 0.0005;
        
        seriesRef.current.update({
          time: now,
          open,
          high,
          low,
          close,
        } as any);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [asset, timeframe, chartType]);

  // Subscribe to real-time signals
  useEffect(() => {
    const channel = supabase
      .channel('binary-signals-chart')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'binary_signals',
        filter: `asset_pair=eq.${asset?.symbol}`,
      }, (payload) => {
        // Signal will be passed from parent component
        console.log('New signal received:', payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [asset]);

  const handleChartTypeChange = useCallback((type: 'line' | 'candlestick') => {
    setChartType(type);
  }, []);

  if (!asset) {
    return (
      <Card className="h-[450px] flex items-center justify-center">
        <div className="text-muted-foreground">Select an asset to view chart</div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <ChartControls 
        chartType={chartType}
        onChartTypeChange={handleChartTypeChange}
        asset={asset}
        timeframe={timeframe}
      />
      
      <div className="relative">
        <div ref={chartContainerRef} className="w-full h-[400px] chart-container" />
        
        {/* Signal markers overlay */}
        {chartRef.current && seriesRef.current && (
          <ChartSignalMarkers
            chart={chartRef.current}
            series={seriesRef.current}
            signals={signals}
            onSignalHover={setHoveredSignal}
            onSignalClick={onSignalClick}
          />
        )}
        
        {/* Active trades overlay */}
        {chartRef.current && seriesRef.current && activeTrades.length > 0 && (
          <TradeZones
            chart={chartRef.current}
            series={seriesRef.current}
            trades={activeTrades}
            currentPrice={asset.current_price}
          />
        )}
        
        {/* Signal information overlay */}
        {hoveredSignal && (
          <SignalOverlay
            signal={hoveredSignal}
            onClose={() => setHoveredSignal(null)}
          />
        )}
      </div>
      
      {/* Current price display */}
      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className="text-xs text-muted-foreground">Current Price</div>
        <div className="text-xl font-bold">
          ${asset.current_price.toFixed(4)}
        </div>
        {asset.change_percent !== undefined && (
          <div className={`text-sm ${asset.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {asset.change_percent >= 0 ? '+' : ''}{asset.change_percent.toFixed(2)}%
          </div>
        )}
      </div>
    </Card>
  );
};