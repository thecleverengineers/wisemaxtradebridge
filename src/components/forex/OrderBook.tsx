import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderLevel {
  price: number;
  amount: number;
  total: number;
  percentage: number;
}

interface OrderBookProps {
  pairSymbol: string;
  currentPrice: number;
  spread: number;
}

export function OrderBook({ pairSymbol, currentPrice, spread }: OrderBookProps) {
  const [bids, setBids] = useState<OrderLevel[]>([]);
  const [asks, setAsks] = useState<OrderLevel[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate order book data
    generateOrderBook();
    
    const interval = setInterval(() => {
      generateOrderBook();
      setLastUpdate(new Date());
    }, 2000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  const generateOrderBook = () => {
    const bidLevels: OrderLevel[] = [];
    const askLevels: OrderLevel[] = [];
    const maxTotal = 100000;

    // Generate bid levels
    for (let i = 0; i < 15; i++) {
      const priceOffset = (i + 1) * 0.00001;
      const price = currentPrice - priceOffset;
      const amount = Math.random() * 50000 + 10000;
      const total = amount * price;
      
      bidLevels.push({
        price,
        amount,
        total,
        percentage: (total / maxTotal) * 100
      });
    }

    // Generate ask levels
    for (let i = 0; i < 15; i++) {
      const priceOffset = (i + 1) * 0.00001;
      const price = currentPrice + priceOffset;
      const amount = Math.random() * 50000 + 10000;
      const total = amount * price;
      
      askLevels.push({
        price,
        amount,
        total,
        percentage: (total / maxTotal) * 100
      });
    }

    setBids(bidLevels);
    setAsks(askLevels);
  };

  const totalBidVolume = bids.reduce((sum, bid) => sum + bid.total, 0);
  const totalAskVolume = asks.reduce((sum, ask) => sum + ask.total, 0);
  const imbalance = ((totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume)) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Order Book - {pairSymbol}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-muted-foreground">
            Spread: <span className="font-medium">{spread.toFixed(5)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Market Depth Indicator */}
        <div className="mb-4 p-3 bg-accent rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Market Depth</span>
            <span className={cn(
              "text-sm font-medium",
              imbalance > 5 ? "text-green-500" : imbalance < -5 ? "text-red-500" : "text-yellow-500"
            )}>
              {imbalance > 0 ? '+' : ''}{imbalance.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={50 + imbalance} 
            className="h-2"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-green-500">Buy Pressure</span>
            <span className="text-xs text-red-500">Sell Pressure</span>
          </div>
        </div>

        {/* Order Book Table */}
        <div className="grid grid-cols-2 gap-2">
          {/* Bids */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <h4 className="text-sm font-medium text-green-500">Bids</h4>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-1 px-2 text-xs text-muted-foreground">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
              </div>
              
              <ScrollArea className="h-[300px]">
                {bids.map((bid, index) => (
                  <div 
                    key={index}
                    className="relative grid grid-cols-3 gap-1 px-2 py-1 text-xs hover:bg-accent"
                  >
                    <div 
                      className="absolute inset-0 bg-green-500 opacity-10"
                      style={{ width: `${bid.percentage}%` }}
                    />
                    <span className="relative font-mono">{bid.price.toFixed(5)}</span>
                    <span className="relative text-right">{bid.amount.toFixed(0)}</span>
                    <span className="relative text-right">{bid.total.toFixed(2)}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>

          {/* Asks */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <h4 className="text-sm font-medium text-red-500">Asks</h4>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-1 px-2 text-xs text-muted-foreground">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
              </div>
              
              <ScrollArea className="h-[300px]">
                {asks.map((ask, index) => (
                  <div 
                    key={index}
                    className="relative grid grid-cols-3 gap-1 px-2 py-1 text-xs hover:bg-accent"
                  >
                    <div 
                      className="absolute inset-0 bg-red-500 opacity-10"
                      style={{ width: `${ask.percentage}%` }}
                    />
                    <span className="relative font-mono">{ask.price.toFixed(5)}</span>
                    <span className="relative text-right">{ask.amount.toFixed(0)}</span>
                    <span className="relative text-right">{ask.total.toFixed(2)}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Volume Summary */}
        <div className="mt-4 grid grid-cols-2 gap-2 p-3 bg-accent rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Bid Volume</p>
            <p className="text-sm font-medium text-green-500">
              ${totalBidVolume.toFixed(0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Ask Volume</p>
            <p className="text-sm font-medium text-red-500">
              ${totalAskVolume.toFixed(0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}