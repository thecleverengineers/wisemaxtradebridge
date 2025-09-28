import React, { useState } from 'react';
import { RiskProfiler } from '@/components/robo/RiskProfiler';
import { PortfolioAllocator } from '@/components/robo/PortfolioAllocator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Brain, 
  TrendingUp, 
  Shield, 
  Zap,
  ChartBar,
  Target,
  Settings,
  DollarSign,
  Activity
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const RoboAdvisor = () => {
  const [riskProfile, setRiskProfile] = useState<string | null>(null);

  const handleProfileComplete = (profile: any) => {
    setRiskProfile(profile.profile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center">
                <Bot className="w-8 h-8 mr-3 text-primary" />
                Robo-Advisor
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-powered portfolio management tailored to your goals
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                <Activity className="w-3 h-3 mr-1" />
                Active
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Managed Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$125,430</div>
              <p className="text-xs text-green-500 mt-1">+15.3% YTD</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">AI Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-blue-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87.5%</div>
              <Progress value={87.5} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riskProfile || 'Not Set'}</div>
              <p className="text-xs text-yellow-500 mt-1">Optimized</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="portfolio">
              <ChartBar className="w-4 h-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="risk">
              <Shield className="w-4 h-4 mr-2" />
              Risk Profile
            </TabsTrigger>
            <TabsTrigger value="strategies">
              <Brain className="w-4 h-4 mr-2" />
              Strategies
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PortfolioAllocator riskProfile={riskProfile || 'Moderate'} />
              
              <Card className="bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-primary" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">Buy Opportunity</div>
                          <div className="text-xs text-muted-foreground">
                            AAPL showing strong momentum, consider increasing position by 5%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">Risk Alert</div>
                          <div className="text-xs text-muted-foreground">
                            Portfolio volatility increased, consider rebalancing
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">Goal Progress</div>
                          <div className="text-xs text-muted-foreground">
                            76% towards retirement goal, on track for 2045
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Brain className="w-4 h-4 mr-2" />
                    View All AI Recommendations
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risk">
            <RiskProfiler onComplete={handleProfileComplete} />
          </TabsContent>

          <TabsContent value="strategies">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: 'Growth Focus',
                  description: 'Maximize long-term capital appreciation',
                  return: '12-18%',
                  risk: 'High',
                  icon: TrendingUp,
                  color: 'text-green-500'
                },
                {
                  name: 'Income Generation',
                  description: 'Steady dividends and interest income',
                  return: '4-6%',
                  risk: 'Low',
                  icon: DollarSign,
                  color: 'text-blue-500'
                },
                {
                  name: 'Balanced Approach',
                  description: 'Mix of growth and income assets',
                  return: '8-12%',
                  risk: 'Medium',
                  icon: Shield,
                  color: 'text-purple-500'
                }
              ].map((strategy, index) => (
                <Card key={index} className="bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20 hover:border-primary/40 transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <strategy.icon className={`w-5 h-5 mr-2 ${strategy.color}`} />
                      {strategy.name}
                    </CardTitle>
                    <CardDescription>{strategy.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expected Return</span>
                        <span className="font-bold">{strategy.return}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Risk Level</span>
                        <Badge variant="outline">{strategy.risk}</Badge>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      Select Strategy
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <Card className="bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20">
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>AI-managed portfolio performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Performance charts and analytics coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RoboAdvisor;