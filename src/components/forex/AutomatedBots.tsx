import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Settings, Play, Pause, TrendingUp, TrendingDown, Activity, AlertTriangle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TradingBot {
  id: string;
  name: string;
  type: 'scalping' | 'trend' | 'grid' | 'arbitrage' | 'martingale';
  status: 'active' | 'paused' | 'stopped';
  pairs: string[];
  winRate: number;
  totalTrades: number;
  todayTrades: number;
  totalProfit: number;
  config: {
    maxTradesPerDay: number;
    stopLoss: number;
    takeProfit: number;
    tradeAmount: number;
    leverage: number;
  };
}

export function AutomatedBots() {
  const { user } = useAuth();
  const [bots, setBots] = useState<TradingBot[]>([
    {
      id: '1',
      name: 'Scalper Pro',
      type: 'scalping',
      status: 'active',
      pairs: ['EUR/USD', 'GBP/USD'],
      winRate: 72,
      totalTrades: 1245,
      todayTrades: 12,
      totalProfit: 3450.50,
      config: {
        maxTradesPerDay: 50,
        stopLoss: 0.5,
        takeProfit: 1.0,
        tradeAmount: 100,
        leverage: 10
      }
    },
    {
      id: '2',
      name: 'Trend Rider',
      type: 'trend',
      status: 'paused',
      pairs: ['USD/JPY', 'EUR/JPY'],
      winRate: 68,
      totalTrades: 450,
      todayTrades: 0,
      totalProfit: 2100.75,
      config: {
        maxTradesPerDay: 10,
        stopLoss: 2.0,
        takeProfit: 5.0,
        tradeAmount: 500,
        leverage: 5
      }
    },
    {
      id: '3',
      name: 'Grid Master',
      type: 'grid',
      status: 'active',
      pairs: ['AUD/USD'],
      winRate: 65,
      totalTrades: 890,
      todayTrades: 8,
      totalProfit: 1875.30,
      config: {
        maxTradesPerDay: 20,
        stopLoss: 1.5,
        takeProfit: 1.5,
        tradeAmount: 200,
        leverage: 10
      }
    }
  ]);

  const [newBot, setNewBot] = useState({
    name: '',
    type: 'scalping',
    pairs: '',
    maxTrades: '20',
    stopLoss: '1.0',
    takeProfit: '2.0',
    tradeAmount: '100',
    leverage: '10'
  });

  const handleToggleBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;

    const newStatus = bot.status === 'active' ? 'paused' : 'active';
    
    // Update bot status in database
    const { error } = await supabase
      .from('bot_strategies')
      .update({ status: newStatus })
      .eq('id', botId)
      .eq('user_id', user?.id);

    if (error) {
      toast.error('Failed to update bot status');
      return;
    }

    setBots(prev => prev.map(b => 
      b.id === botId ? { ...b, status: newStatus } : b
    ));

    toast.success(`Bot ${newStatus === 'active' ? 'activated' : 'paused'}`);
  };

  const handleCreateBot = async () => {
    if (!newBot.name || !newBot.pairs) {
      toast.error('Please fill in all required fields');
      return;
    }

    const config = {
      max_trades_per_day: parseInt(newBot.maxTrades),
      stop_loss: parseFloat(newBot.stopLoss),
      take_profit: parseFloat(newBot.takeProfit),
      trade_amount: parseFloat(newBot.tradeAmount),
      leverage: parseInt(newBot.leverage),
      pairs: newBot.pairs.split(',').map(p => p.trim())
    };

    const { data, error } = await supabase
      .from('bot_strategies')
      .insert({
        user_id: user?.id,
        name: newBot.name,
        strategy_type: newBot.type,
        risk_level: 'medium',
        allocated_amount: parseFloat(newBot.tradeAmount),
        status: 'inactive'
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create bot');
      return;
    }

    const createdBot: TradingBot = {
      id: data.id,
      name: data.name,
      type: data.strategy_type as any,
      status: 'stopped',
      pairs: config.pairs,
      winRate: 0,
      totalTrades: 0,
      todayTrades: 0,
      totalProfit: 0,
      config: {
        maxTradesPerDay: config.max_trades_per_day,
        stopLoss: config.stop_loss,
        takeProfit: config.take_profit,
        tradeAmount: config.trade_amount,
        leverage: config.leverage
      }
    };

    setBots(prev => [...prev, createdBot]);
    toast.success('Trading bot created successfully');
    
    // Reset form
    setNewBot({
      name: '',
      type: 'scalping',
      pairs: '',
      maxTrades: '20',
      stopLoss: '1.0',
      takeProfit: '2.0',
      tradeAmount: '100',
      leverage: '10'
    });
  };

  const getBotTypeIcon = (type: string) => {
    switch (type) {
      case 'scalping': return <Zap className="h-4 w-4" />;
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'grid': return <Activity className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getBotTypeColor = (type: string) => {
    switch (type) {
      case 'scalping': return 'text-purple-500';
      case 'trend': return 'text-blue-500';
      case 'grid': return 'text-green-500';
      case 'arbitrage': return 'text-yellow-500';
      case 'martingale': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Create New Bot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Create Trading Bot
          </CardTitle>
          <CardDescription>
            Configure and deploy automated trading strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Bot Name</Label>
              <Input
                value={newBot.name}
                onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                placeholder="e.g., My Scalper Bot"
              />
            </div>
            
            <div>
              <Label>Strategy Type</Label>
              <Select 
                value={newBot.type} 
                onValueChange={(value) => setNewBot({ ...newBot, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scalping">Scalping (Quick trades)</SelectItem>
                  <SelectItem value="trend">Trend Following</SelectItem>
                  <SelectItem value="grid">Grid Trading</SelectItem>
                  <SelectItem value="arbitrage">Arbitrage</SelectItem>
                  <SelectItem value="martingale">Martingale (High risk)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Currency Pairs</Label>
              <Input
                value={newBot.pairs}
                onChange={(e) => setNewBot({ ...newBot, pairs: e.target.value })}
                placeholder="EUR/USD, GBP/USD"
              />
            </div>
            
            <div>
              <Label>Max Trades/Day</Label>
              <Input
                type="number"
                value={newBot.maxTrades}
                onChange={(e) => setNewBot({ ...newBot, maxTrades: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Stop Loss (%)</Label>
              <Input
                type="number"
                value={newBot.stopLoss}
                onChange={(e) => setNewBot({ ...newBot, stopLoss: e.target.value })}
                step="0.1"
              />
            </div>
            
            <div>
              <Label>Take Profit (%)</Label>
              <Input
                type="number"
                value={newBot.takeProfit}
                onChange={(e) => setNewBot({ ...newBot, takeProfit: e.target.value })}
                step="0.1"
              />
            </div>
            
            <div>
              <Label>Trade Amount (USD)</Label>
              <Input
                type="number"
                value={newBot.tradeAmount}
                onChange={(e) => setNewBot({ ...newBot, tradeAmount: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Leverage</Label>
              <Input
                type="number"
                value={newBot.leverage}
                onChange={(e) => setNewBot({ ...newBot, leverage: e.target.value })}
              />
            </div>
          </div>
          
          <Button className="w-full mt-4" onClick={handleCreateBot}>
            <Bot className="h-4 w-4 mr-2" />
            Create Bot
          </Button>
        </CardContent>
      </Card>

      {/* Active Bots */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Active Trading Bots
            </CardTitle>
            <Badge variant="secondary">
              {bots.filter(b => b.status === 'active').length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {bots.map((bot) => (
                <div 
                  key={bot.id}
                  className={cn(
                    "p-4 rounded-lg border",
                    bot.status === 'active' && "bg-accent border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-background", getBotTypeColor(bot.type))}>
                        {getBotTypeIcon(bot.type)}
                      </div>
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {bot.name}
                          <Badge variant={bot.status === 'active' ? 'default' : 'outline'}>
                            {bot.status}
                          </Badge>
                        </h4>
                        <p className="text-xs text-muted-foreground capitalize">
                          {bot.type} Strategy
                        </p>
                      </div>
                    </div>
                    
                    <Switch
                      checked={bot.status === 'active'}
                      onCheckedChange={() => handleToggleBot(bot.id)}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                      <p className={cn(
                        "font-medium",
                        bot.winRate >= 70 ? "text-green-500" : 
                        bot.winRate >= 50 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {bot.winRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Trades</p>
                      <p className="font-medium">{bot.totalTrades}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Today</p>
                      <p className="font-medium">{bot.todayTrades}/{bot.config.maxTradesPerDay}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Profit</p>
                      <p className={cn(
                        "font-medium",
                        bot.totalProfit > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        ${bot.totalProfit.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Daily Progress</span>
                      <span className="text-xs">{bot.todayTrades}/{bot.config.maxTradesPerDay}</span>
                    </div>
                    <Progress 
                      value={(bot.todayTrades / bot.config.maxTradesPerDay) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-2">
                      {bot.pairs.map(pair => (
                        <Badge key={pair} variant="secondary">
                          {pair}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-3">
                      <span>SL: {bot.config.stopLoss}%</span>
                      <span>TP: {bot.config.takeProfit}%</span>
                      <span>Leverage: {bot.config.leverage}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}