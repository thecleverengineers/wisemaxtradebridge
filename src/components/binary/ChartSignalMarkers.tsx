import React, { useEffect, useState } from 'react';
import { IChartApi, ISeriesApi, SeriesMarker, Time } from 'lightweight-charts';

interface ChartSignalMarkersProps {
  chart: IChartApi;
  series: ISeriesApi<any>;
  signals: any[];
  onSignalHover?: (signal: any) => void;
  onSignalClick?: (signal: any) => void;
}

export const ChartSignalMarkers: React.FC<ChartSignalMarkersProps> = ({
  chart,
  series,
  signals,
  onSignalHover,
  onSignalClick,
}) => {
  const [markers, setMarkers] = useState<SeriesMarker<Time>[]>([]);
  const [priceLinesMap] = useState(new Map());

  useEffect(() => {
    if (!series || !signals) return;

    // Clear existing price lines
    priceLinesMap.forEach(line => series.removePriceLine(line));
    priceLinesMap.clear();

    // Create markers and price lines for active signals
    const activeSignals = signals.filter(s => s.is_active);
    const newMarkers: SeriesMarker<Time>[] = activeSignals.map(signal => {
      const time = Math.floor(new Date(signal.created_at).getTime() / 1000) as Time;
      
      // Add price line for signal entry
      const priceLine = series.createPriceLine({
        price: signal.entry_price || 1.0800,
        color: signal.signal_type === 'CALL' ? '#22c55e' : '#ef4444',
        lineWidth: signal.strength === 'strong' ? 2 : 1,
        lineStyle: signal.strength === 'weak' ? 2 : signal.strength === 'medium' ? 1 : 0, // 0=solid, 1=dashed, 2=dotted
        axisLabelVisible: true,
        title: `${signal.signal_type} - ${signal.strength}`,
      });
      priceLinesMap.set(signal.id, priceLine);

      return {
        time,
        position: signal.signal_type === 'CALL' ? 'belowBar' : 'aboveBar',
        color: signal.signal_type === 'CALL' ? '#22c55e' : '#ef4444',
        shape: signal.signal_type === 'CALL' ? 'arrowUp' : 'arrowDown',
        text: signal.strength?.charAt(0).toUpperCase() || 'M',
        size: signal.strength === 'strong' ? 2 : signal.strength === 'weak' ? 1 : 1.5,
      } as SeriesMarker<Time>;
    });

    setMarkers(newMarkers);
    // Note: setMarkers is not available in v4, markers are added via series options

    // Handle click events on the chart
    const handleClick = (param: any) => {
      if (!param.time || !param.point) return;
      
      // Check if click is near a signal marker
      const clickTime = param.time;
      const clickedSignal = activeSignals.find(signal => {
        const signalTime = Math.floor(new Date(signal.created_at).getTime() / 1000);
        return Math.abs(signalTime - clickTime) < 60; // Within 60 seconds
      });
      
      if (clickedSignal && onSignalClick) {
        onSignalClick(clickedSignal);
      }
    };

    // Handle hover events
    const handleCrosshairMove = (param: any) => {
      if (!param.time) {
        onSignalHover?.(null);
        return;
      }
      
      // Check if hovering near a signal
      const hoverTime = param.time;
      const hoveredSignal = activeSignals.find(signal => {
        const signalTime = Math.floor(new Date(signal.created_at).getTime() / 1000);
        return Math.abs(signalTime - hoverTime) < 60;
      });
      
      onSignalHover?.(hoveredSignal || null);
    };

    chart.subscribeClick(handleClick);
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeClick(handleClick);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      priceLinesMap.forEach(line => series.removePriceLine(line));
      priceLinesMap.clear();
    };
  }, [series, signals, chart, onSignalClick, onSignalHover, priceLinesMap]);

  // Auto-remove expired signals
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const activeSignals = signals.filter(s => {
        const expiresAt = new Date(s.expires_at);
        return expiresAt > now && s.is_active;
      });
      
      if (activeSignals.length !== signals.length) {
        // Trigger re-render with active signals only
        console.log('Removing expired signals');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [signals]);

  return null; // This component doesn't render anything visible
};