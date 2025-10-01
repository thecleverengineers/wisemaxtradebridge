import React, { useEffect, useState } from 'react';
import { Line } from 'recharts';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface PriceChartProps {
  asset: any;
  timeframe: any;
}

export const PriceChart: React.FC<PriceChartProps> = ({ asset, timeframe }) => {
  const [priceData, setPriceData] = useState<any[]>([]);

  useEffect(() => {
    // Generate fake price data for now
    const generatePriceData = () => {
      const data = [];
      const basePrice = asset.current_price;
      for (let i = 0; i < 50; i++) {
        const variation = (Math.random() - 0.5) * basePrice * 0.002;
        data.push({
          time: i,
          price: basePrice + variation
        });
      }
      setPriceData(data);
    };

    if (asset) {
      generatePriceData();
      const interval = setInterval(generatePriceData, 5000);
      return () => clearInterval(interval);
    }
  }, [asset]);

  return (
    <div className="h-[300px] w-full">
      <div className="text-center text-muted-foreground">
        Chart for {asset?.symbol || 'Select an asset'}
      </div>
      <div className="h-full flex items-center justify-center text-4xl font-bold">
        ${asset?.current_price.toFixed(4) || '0.0000'}
      </div>
    </div>
  );
};