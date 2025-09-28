import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface OrderBookProps {
  symbol?: string;
}

export function OrderBook({ symbol = 'BTCUSD' }: OrderBookProps) {
  // Generate sample order book data
  const generateOrders = (type: 'buy' | 'sell', count: number) => {
    const basePrice = 43567.89;
    const orders = [];
    
    for (let i = 0; i < count; i++) {
      const priceOffset = type === 'buy' ? -i * 10 : i * 10;
      const price = basePrice + priceOffset;
      const amount = (Math.random() * 5).toFixed(4);
      const total = (price * parseFloat(amount)).toFixed(2);
      
      orders.push({
        price: price.toFixed(2),
        amount,
        total,
        percentage: Math.random() * 100,
      });
    }
    
    return orders;
  };

  const buyOrders = generateOrders('buy', 10);
  const sellOrders = generateOrders('sell', 10);

  return (
    <Card className="bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20 h-full">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-primary" />
          Order Book
        </h3>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buy" className="text-green-500">Buy</TabsTrigger>
            <TabsTrigger value="sell" className="text-red-500">Sell</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2">
            {/* Sell Orders */}
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-xs text-muted-foreground px-2">
                <span>Price</span>
                <span className="text-center">Amount</span>
                <span className="text-right">Total</span>
              </div>
              
              {sellOrders.slice(0, 5).reverse().map((order, idx) => (
                <div key={idx} className="grid grid-cols-3 text-sm px-2 py-1 hover:bg-red-500/10 cursor-pointer relative">
                  <div 
                    className="absolute inset-0 bg-red-500/10 opacity-30"
                    style={{ width: `${order.percentage}%` }}
                  />
                  <span className="text-red-500 relative z-10">{order.price}</span>
                  <span className="text-center relative z-10">{order.amount}</span>
                  <span className="text-right relative z-10">{order.total}</span>
                </div>
              ))}
            </div>

            {/* Current Price */}
            <div className="py-2 px-2 bg-primary/10 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">43,567.89</span>
                <span className="text-xs text-green-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.34%
                </span>
              </div>
            </div>

            {/* Buy Orders */}
            <div className="space-y-1">
              {buyOrders.slice(0, 5).map((order, idx) => (
                <div key={idx} className="grid grid-cols-3 text-sm px-2 py-1 hover:bg-green-500/10 cursor-pointer relative">
                  <div 
                    className="absolute inset-0 bg-green-500/10 opacity-30"
                    style={{ width: `${order.percentage}%` }}
                  />
                  <span className="text-green-500 relative z-10">{order.price}</span>
                  <span className="text-center relative z-10">{order.amount}</span>
                  <span className="text-right relative z-10">{order.total}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="buy">
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-xs text-muted-foreground px-2">
                <span>Price</span>
                <span className="text-center">Amount</span>
                <span className="text-right">Total</span>
              </div>
              
              {buyOrders.map((order, idx) => (
                <div key={idx} className="grid grid-cols-3 text-sm px-2 py-1 hover:bg-green-500/10 cursor-pointer relative">
                  <div 
                    className="absolute inset-0 bg-green-500/10 opacity-30"
                    style={{ width: `${order.percentage}%` }}
                  />
                  <span className="text-green-500 relative z-10">{order.price}</span>
                  <span className="text-center relative z-10">{order.amount}</span>
                  <span className="text-right relative z-10">{order.total}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sell">
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-xs text-muted-foreground px-2">
                <span>Price</span>
                <span className="text-center">Amount</span>
                <span className="text-right">Total</span>
              </div>
              
              {sellOrders.map((order, idx) => (
                <div key={idx} className="grid grid-cols-3 text-sm px-2 py-1 hover:bg-red-500/10 cursor-pointer relative">
                  <div 
                    className="absolute inset-0 bg-red-500/10 opacity-30"
                    style={{ width: `${order.percentage}%` }}
                  />
                  <span className="text-red-500 relative z-10">{order.price}</span>
                  <span className="text-center relative z-10">{order.amount}</span>
                  <span className="text-right relative z-10">{order.total}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Trade Section */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Price</label>
              <Input 
                type="number" 
                defaultValue="43567.89" 
                className="h-8 text-sm bg-background/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Amount</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="h-8 text-sm bg-background/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <TrendingUp className="w-4 h-4 mr-1" />
              Buy
            </Button>
            <Button className="w-full bg-red-600 hover:bg-red-700">
              <TrendingDown className="w-4 h-4 mr-1" />
              Sell
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}