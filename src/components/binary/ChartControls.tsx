import React from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LineChart, CandlestickChart, Maximize2 } from 'lucide-react';

interface ChartControlsProps {
  chartType: 'line' | 'candlestick';
  onChartTypeChange: (type: 'line' | 'candlestick') => void;
  asset: any;
  timeframe: any;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  chartType,
  onChartTypeChange,
  asset,
  timeframe,
}) => {
  return (
    <div className="flex justify-between items-center p-3 border-b">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-sm font-semibold">{asset?.symbol || 'Select Asset'}</div>
          <div className="text-xs text-muted-foreground">{asset?.name}</div>
        </div>
        {timeframe && (
          <div className="text-sm text-muted-foreground">
            {timeframe.name}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <ToggleGroup 
          type="single" 
          value={chartType}
          onValueChange={(value) => value && onChartTypeChange(value as 'line' | 'candlestick')}
        >
          <ToggleGroupItem value="line" aria-label="Line chart">
            <LineChart className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="candlestick" aria-label="Candlestick chart">
            <CandlestickChart className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // Implement fullscreen functionality
            const chartContainer = document.querySelector('.chart-container');
            if (chartContainer && chartContainer.requestFullscreen) {
              chartContainer.requestFullscreen();
            }
          }}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};