import React, { useEffect } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';

interface TradeZonesProps {
  chart: IChartApi;
  series: ISeriesApi<any>;
  trades: any[];
  currentPrice: number;
}

export const TradeZones: React.FC<TradeZonesProps> = ({
  chart,
  series,
  trades,
  currentPrice,
}) => {
  useEffect(() => {
    if (!series || !trades) return;

    const priceLinesMap = new Map();

    // Create price lines for active trades
    trades.forEach(trade => {
      if (trade.status !== 'pending') return;

      // Entry price line
      const entryLine = series.createPriceLine({
        price: trade.entry_price,
        color: '#3b82f6',
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: `Entry: $${trade.stake_amount}`,
      });
      priceLinesMap.set(`${trade.id}-entry`, entryLine);

      // Calculate profit/loss zones
      const payoutAmount = trade.stake_amount * (1 + trade.payout_rate);
      const isWinning = trade.trade_type === 'CALL' 
        ? currentPrice > trade.entry_price 
        : currentPrice < trade.entry_price;

      // Target zone indicator
      if (trade.trade_type === 'CALL') {
        const targetLine = series.createPriceLine({
          price: trade.entry_price + 0.0010, // Example target
          color: '#22c55e',
          lineWidth: 1,
          lineStyle: 2, // Dotted
          axisLabelVisible: false,
        });
        priceLinesMap.set(`${trade.id}-target`, targetLine);
      } else {
        const targetLine = series.createPriceLine({
          price: trade.entry_price - 0.0010, // Example target
          color: '#ef4444',
          lineWidth: 1,
          lineStyle: 2, // Dotted
          axisLabelVisible: false,
        });
        priceLinesMap.set(`${trade.id}-target`, targetLine);
      }
    });

    return () => {
      priceLinesMap.forEach(line => series.removePriceLine(line));
      priceLinesMap.clear();
    };
  }, [series, trades, currentPrice]);

  // Display P&L overlay for active trades
  const activeTrades = trades.filter(t => t.status === 'pending');
  
  return (
    <>
      {activeTrades.map(trade => {
        const isWinning = trade.trade_type === 'CALL' 
          ? currentPrice > trade.entry_price 
          : currentPrice < trade.entry_price;
        
        const pnl = isWinning 
          ? trade.stake_amount * trade.payout_rate 
          : -trade.stake_amount;
        
        const timeRemaining = new Date(trade.expiry_time).getTime() - Date.now();
        const secondsRemaining = Math.max(0, Math.floor(timeRemaining / 1000));
        
        return (
          <div
            key={trade.id}
            className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <div className={`font-semibold ${isWinning ? 'text-green-500' : 'text-red-500'}`}>
                {isWinning ? '+' : ''}{pnl.toFixed(2)} USDT
              </div>
              <div className="text-muted-foreground">
                {secondsRemaining}s
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {trade.trade_type} @ {trade.entry_price.toFixed(4)}
            </div>
          </div>
        );
      })}
    </>
  );
};