import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  Bot, 
  TrendingUp, 
  Shield, 
  RefreshCw, 
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AllocationData {
  name: string;
  value: number;
  color: string;
  assets: string[];
}

const conservativeAllocation: AllocationData[] = [
  { name: 'Bonds', value: 60, color: '#3B82F6', assets: ['US Treasury', 'Corporate Bonds'] },
  { name: 'Stocks', value: 30, color: '#10B981', assets: ['S&P 500', 'Dividend Stocks'] },
  { name: 'Alternative', value: 10, color: '#F59E0B', assets: ['Gold', 'REITs'] }
];

const moderateAllocation: AllocationData[] = [
  { name: 'Stocks', value: 50, color: '#10B981', assets: ['S&P 500', 'International'] },
  { name: 'Bonds', value: 35, color: '#3B82F6', assets: ['Mixed Bonds'] },
  { name: 'Alternative', value: 15, color: '#F59E0B', assets: ['Commodities', 'REITs'] }
];

const aggressiveAllocation: AllocationData[] = [
  { name: 'Stocks', value: 70, color: '#10B981', assets: ['Growth Stocks', 'Tech'] },
  { name: 'Alternative', value: 20, color: '#F59E0B', assets: ['Crypto', 'Options'] },
  { name: 'Bonds', value: 10, color: '#3B82F6', assets: ['High-Yield Bonds'] }
];

export function PortfolioAllocator({ riskProfile = 'Moderate' }: { riskProfile?: string }) {
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [lastRebalance, setLastRebalance] = useState<Date | null>(null);
  const { toast } = useToast();

  const getAllocation = () => {
    switch (riskProfile) {
      case 'Conservative':
        return conservativeAllocation;
      case 'Aggressive':
      case 'Very Aggressive':
        return aggressiveAllocation;
      default:
        return moderateAllocation;
    }
  };

  const currentAllocation = getAllocation();

  const handleRebalance = () => {
    setIsRebalancing(true);
    
    setTimeout(() => {
      setIsRebalancing(false);
      setLastRebalance(new Date());
      toast({
        title: "Portfolio Rebalanced",
        description: "Your portfolio has been successfully rebalanced according to your risk profile.",
      });
    }, 2000);
  };

  const handleAutomate = () => {
    toast({
      title: "Automation Enabled",
      description: "Your portfolio will be automatically rebalanced monthly.",
    });
  };

  return (
    <Card className="bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2 text-primary" />
              Robo-Advisor Portfolio
            </CardTitle>
            <CardDescription>
              AI-optimized allocation based on your {riskProfile} risk profile
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/50">
            <Shield className="w-3 h-3 mr-1" />
            {riskProfile}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentAllocation}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {currentAllocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation Details */}
        <div className="space-y-3">
          {currentAllocation.map((allocation, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: allocation.color }}
                  />
                  <span className="font-medium">{allocation.name}</span>
                </div>
                <span className="font-bold">{allocation.value}%</span>
              </div>
              <Progress 
                value={allocation.value} 
                className="h-2"
                style={{
                  '--progress-color': allocation.color
                } as React.CSSProperties}
              />
              <div className="text-xs text-muted-foreground">
                {allocation.assets.join(' • ')}
              </div>
            </div>
          ))}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Expected Return</div>
            <div className="text-xl font-bold text-green-500">
              {riskProfile === 'Conservative' ? '6-8%' : 
               riskProfile === 'Moderate' ? '8-12%' : '12-18%'}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Risk Level</div>
            <div className="text-xl font-bold">
              {riskProfile === 'Conservative' ? 'Low' : 
               riskProfile === 'Moderate' ? 'Medium' : 'High'}
            </div>
          </div>
        </div>

        {/* Status */}
        {lastRebalance && (
          <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                Last rebalanced: {lastRebalance.toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button 
            onClick={handleRebalance}
            disabled={isRebalancing}
            className="flex-1"
          >
            {isRebalancing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Rebalancing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Rebalance Now
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleAutomate}
            variant="outline"
            className="flex-1"
          >
            <Bot className="w-4 h-4 mr-2" />
            Automate
          </Button>
        </div>

        {/* Info */}
        <div className="flex items-start space-x-2 p-3 bg-primary/5 rounded-lg">
          <Info className="w-4 h-4 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            This AI-powered allocation is optimized for your risk tolerance and automatically adjusts based on market conditions.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}