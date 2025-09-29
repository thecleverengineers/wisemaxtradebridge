import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, TrendingUp, Shield, Copy, Star, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MasterTrader {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  followers: number;
  winRate: number;
  avgMonthlyReturn: number;
  totalReturn: number;
  riskScore: number;
  tradingStyle: string;
  minInvestment: number;
  fee: number;
  isFollowing?: boolean;
  recentTrades: {
    pair: string;
    profit: number;
    time: string;
  }[];
}

export function CopyTrading() {
  const [selectedTrader, setSelectedTrader] = useState<MasterTrader | null>(null);
  const [copyAmount, setCopyAmount] = useState('1000');
  const [riskLevel, setRiskLevel] = useState([50]);
  const [traders] = useState<MasterTrader[]>([
    {
      id: '1',
      name: 'Alex Thompson',
      avatar: '👨‍💼',
      rating: 4.8,
      followers: 1250,
      winRate: 78,
      avgMonthlyReturn: 12.5,
      totalReturn: 156,
      riskScore: 3,
      tradingStyle: 'Conservative',
      minInvestment: 500,
      fee: 20,
      recentTrades: [
        { pair: 'EUR/USD', profit: 125, time: '2h ago' },
        { pair: 'GBP/JPY', profit: -45, time: '5h ago' },
        { pair: 'USD/CHF', profit: 89, time: '8h ago' }
      ]
    },
    {
      id: '2',
      name: 'Sarah Chen',
      avatar: '👩‍💼',
      rating: 4.9,
      followers: 2840,
      winRate: 82,
      avgMonthlyReturn: 18.3,
      totalReturn: 245,
      riskScore: 5,
      tradingStyle: 'Aggressive',
      minInvestment: 1000,
      fee: 25,
      isFollowing: true,
      recentTrades: [
        { pair: 'EUR/GBP', profit: 340, time: '1h ago' },
        { pair: 'AUD/USD', profit: 210, time: '3h ago' },
        { pair: 'NZD/JPY', profit: -120, time: '6h ago' }
      ]
    },
    {
      id: '3',
      name: 'Marcus Weber',
      avatar: '👨‍💼',
      rating: 4.6,
      followers: 890,
      winRate: 71,
      avgMonthlyReturn: 9.8,
      totalReturn: 98,
      riskScore: 2,
      tradingStyle: 'Balanced',
      minInvestment: 250,
      fee: 15,
      recentTrades: [
        { pair: 'USD/CAD', profit: 67, time: '30m ago' },
        { pair: 'EUR/JPY', profit: 93, time: '2h ago' },
        { pair: 'GBP/USD', profit: -28, time: '4h ago' }
      ]
    },
    {
      id: '4',
      name: 'Emma Roberts',
      avatar: '👩‍💼',
      rating: 4.7,
      followers: 1560,
      winRate: 75,
      avgMonthlyReturn: 14.2,
      totalReturn: 178,
      riskScore: 4,
      tradingStyle: 'Scalping',
      minInvestment: 750,
      fee: 18,
      recentTrades: [
        { pair: 'EUR/CHF', profit: 45, time: '15m ago' },
        { pair: 'AUD/JPY', profit: 78, time: '45m ago' },
        { pair: 'USD/JPY', profit: 112, time: '1.5h ago' }
      ]
    }
  ]);

  const handleCopyTrader = (trader: MasterTrader) => {
    const amount = parseFloat(copyAmount);
    if (amount < trader.minInvestment) {
      toast.error(`Minimum investment is $${trader.minInvestment}`);
      return;
    }

    // Simulate copying trader
    toast.success(`Successfully started copying ${trader.name} with $${amount}`);
    setSelectedTrader(null);
    setCopyAmount('1000');
  };

  const getRiskColor = (score: number) => {
    if (score <= 2) return 'text-green-500';
    if (score <= 4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 2) return 'Low Risk';
    if (score <= 4) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Copy Trading
            </CardTitle>
            <CardDescription>
              Follow and copy successful traders automatically
            </CardDescription>
          </div>
          <Badge variant="secondary">
            <UserCheck className="h-3 w-3 mr-1" />
            {traders.filter(t => t.isFollowing).length} Following
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {traders.map((trader) => (
              <div 
                key={trader.id}
                className={cn(
                  "p-4 rounded-lg border",
                  trader.isFollowing && "bg-accent border-primary/50"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{trader.avatar}</div>
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {trader.name}
                        {trader.isFollowing && (
                          <Badge variant="default" className="text-xs">
                            Following
                          </Badge>
                        )}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i < Math.floor(trader.rating) 
                                ? "fill-yellow-500 text-yellow-500" 
                                : "text-muted-foreground"
                            )}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({trader.rating})
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {trader.followers} followers
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {trader.tradingStyle}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className="font-medium text-green-500">{trader.winRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="font-medium">+{trader.avgMonthlyReturn}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Return</p>
                    <p className="font-medium">+{trader.totalReturn}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Risk</p>
                    <p className={cn("font-medium", getRiskColor(trader.riskScore))}>
                      {getRiskLabel(trader.riskScore)}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Recent Performance</p>
                  <div className="flex gap-2">
                    {trader.recentTrades.map((trade, index) => (
                      <div 
                        key={index}
                        className="flex-1 text-center p-2 bg-background rounded"
                      >
                        <p className="text-xs font-medium">{trade.pair}</p>
                        <p className={cn(
                          "text-xs",
                          trade.profit > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {trade.profit > 0 ? '+' : ''}{trade.profit}
                        </p>
                        <p className="text-xs text-muted-foreground">{trade.time}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Min: </span>
                    <span className="font-medium">${trader.minInvestment}</span>
                    <span className="text-muted-foreground ml-2">Fee: </span>
                    <span className="font-medium">{trader.fee}%</span>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm"
                        variant={trader.isFollowing ? "outline" : "default"}
                        onClick={() => setSelectedTrader(trader)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {trader.isFollowing ? 'Manage' : 'Copy'}
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Copy {trader.name}</DialogTitle>
                        <DialogDescription>
                          Set your copy trading parameters
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Investment Amount (USD)</Label>
                          <Input
                            type="number"
                            value={copyAmount}
                            onChange={(e) => setCopyAmount(e.target.value)}
                            min={trader.minInvestment}
                            placeholder={`Min: $${trader.minInvestment}`}
                          />
                        </div>
                        
                        <div>
                          <Label>Risk Management ({riskLevel[0]}%)</Label>
                          <Slider
                            value={riskLevel}
                            onValueChange={setRiskLevel}
                            min={10}
                            max={100}
                            step={10}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Copy {riskLevel[0]}% of trader's position sizes
                          </p>
                        </div>
                        
                        <div className="p-3 bg-accent rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">Important</span>
                          </div>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Past performance doesn't guarantee future results</li>
                            <li>• You can stop copying at any time</li>
                            <li>• Performance fee: {trader.fee}% of profits</li>
                          </ul>
                        </div>
                        
                        <Button 
                          className="w-full"
                          onClick={() => handleCopyTrader(trader)}
                        >
                          {trader.isFollowing ? 'Update Copy Settings' : 'Start Copying'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}