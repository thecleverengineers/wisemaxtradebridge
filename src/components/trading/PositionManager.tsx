import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Edit2, TrendingUp, TrendingDown, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Position {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: Date;
  status: 'open' | 'pending' | 'closed';
}

export function PositionManager() {
  const { toast } = useToast();
  const [positions] = useState<Position[]>([
    {
      id: '1',
      symbol: 'BTCUSD',
      type: 'buy',
      amount: 0.5,
      entryPrice: 42500,
      currentPrice: 43567.89,
      pnl: 533.95,
      pnlPercent: 2.51,
      stopLoss: 41000,
      takeProfit: 45000,
      timestamp: new Date(),
      status: 'open',
    },
    {
      id: '2',
      symbol: 'ETHUSD',
      type: 'sell',
      amount: 2,
      entryPrice: 2650,
      currentPrice: 2625,
      pnl: 50,
      pnlPercent: 0.94,
      stopLoss: 2700,
      takeProfit: 2550,
      timestamp: new Date(),
      status: 'open',
    },
    {
      id: '3',
      symbol: 'EURUSD',
      type: 'buy',
      amount: 10000,
      entryPrice: 1.0850,
      currentPrice: 1.0865,
      pnl: 15,
      pnlPercent: 0.14,
      timestamp: new Date(),
      status: 'pending',
    },
  ]);

  const handleClosePosition = (id: string) => {
    toast({
      title: "Position Closed",
      description: "Your position has been closed successfully.",
    });
  };

  const handleEditPosition = (id: string) => {
    toast({
      title: "Edit Position",
      description: "Position editing panel opened.",
    });
  };

  const openPositions = positions.filter(p => p.status === 'open');
  const pendingOrders = positions.filter(p => p.status === 'pending');
  const closedPositions = positions.filter(p => p.status === 'closed');

  const PositionRow = ({ position }: { position: Position }) => (
    <div className="p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <Badge variant={position.type === 'buy' ? 'default' : 'destructive'} className="px-2 py-0.5">
            {position.type === 'buy' ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {position.type.toUpperCase()}
          </Badge>
          <span className="font-semibold">{position.symbol}</span>
          <span className="text-sm text-muted-foreground">{position.amount}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleEditPosition(position.id)}
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-600"
            onClick={() => handleClosePosition(position.id)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Entry:</span>
          <span className="ml-1 font-medium">${position.entryPrice.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Current:</span>
          <span className="ml-1 font-medium">${position.currentPrice.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">P&L:</span>
          <span className={`ml-1 font-medium ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(2)}%)
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">
            <Clock className="w-3 h-3 inline mr-1" />
            {position.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {(position.stopLoss || position.takeProfit) && (
        <div className="flex items-center space-x-4 mt-2 pt-2 border-t border-border/50">
          {position.stopLoss && (
            <div className="flex items-center text-xs">
              <span className="text-red-500">SL: ${position.stopLoss.toLocaleString()}</span>
            </div>
          )}
          {position.takeProfit && (
            <div className="flex items-center text-xs">
              <span className="text-green-500">TP: ${position.takeProfit.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Card className="bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary" />
            Position Manager
          </h3>
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">Total P&L:</span>
            <span className="font-bold text-green-500">+$598.95</span>
          </div>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="open">
              Open ({openPositions.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-3">
            {openPositions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No open positions
              </div>
            ) : (
              openPositions.map(position => (
                <PositionRow key={position.id} position={position} />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No pending orders
              </div>
            ) : (
              pendingOrders.map(position => (
                <PositionRow key={position.id} position={position} />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No trading history yet
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Win Rate</div>
            <div className="font-bold text-green-500">68.5%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Avg Profit</div>
            <div className="font-bold">$125.45</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total Trades</div>
            <div className="font-bold">156</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Risk Level</div>
            <div className="font-bold text-yellow-500">Medium</div>
          </div>
        </div>
      </div>
    </Card>
  );
}