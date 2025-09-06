
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity,
  PieChart,
  CreditCard,
  Zap,
  Brain,
  Star,
  Gift,
  Target,
  Trophy,
  Flame,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Signal,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedDashboard } from './AdvancedDashboard';
import { CryptoTradingWidget } from './CryptoTradingWidget';
import { ReferralSystem } from './ReferralSystem';
import { PaymentIntegration } from './PaymentIntegration';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalBalance: number;
  totalInvestment: number;
  totalEarnings: number;
  activeTrades: number;
  totalTrades: number;
  winRate: number;
  todayPnL: number;
  referralEarnings: number;
}

interface RecentTrade {
  id: string;
  asset_symbol: string;
  direction: string;
  stake: number;
  result: string;
  payout: number;
  created_at: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

export const DashboardContent = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalBalance: 0,
    totalInvestment: 0,
    totalEarnings: 0,
    activeTrades: 0,
    totalTrades: 0,
    winRate: 0,
    todayPnL: 0,
    referralEarnings: 0
  });
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load wallet data
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      // Load user profile data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      // Simulate additional trading stats (in real app, this would come from trading API)
      const stats: DashboardStats = {
        totalBalance: walletData?.total_balance || 0,
        totalInvestment: userData?.total_investment || 0,
        totalEarnings: userData?.total_roi_earned || 0,
        activeTrades: Math.floor(Math.random() * 5), // Simulate active trades
        totalTrades: Math.floor(Math.random() * 50) + 10,
        winRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        todayPnL: (Math.random() - 0.5) * 1000, // Random P&L
        referralEarnings: userData?.total_referral_earned || 0
      };

      setDashboardStats(stats);

      // Simulate recent trades
      const mockTrades: RecentTrade[] = [
        {
          id: '1',
          asset_symbol: 'EURUSD',
          direction: 'UP',
          stake: 50,
          result: 'win',
          payout: 92.5,
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: '2',
          asset_symbol: 'BTCUSD',
          direction: 'DOWN',
          stake: 25,
          result: 'loss',
          payout: 0,
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          id: '3',
          asset_symbol: 'GOLD',
          direction: 'UP',
          stake: 100,
          result: 'win',
          payout: 185,
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
      ];

      setRecentTrades(mockTrades);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Start Trading',
      description: 'Begin trading with live market data',
      icon: Target,
      color: 'from-green-500 to-emerald-600',
      action: () => navigate('/trading')
    },
    {
      title: 'Forex Trading',
      description: 'Trade major currency pairs',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      action: () => navigate('/forex-trading')
    },
    {
      title: 'Investments',
      description: 'Explore investment opportunities',
      icon: PieChart,
      color: 'from-purple-500 to-purple-600',
      action: () => navigate('/invest')
    },
    {
      title: 'My Wallet',
      description: 'Manage your funds',
      icon: Wallet,
      color: 'from-orange-500 to-orange-600',
      action: () => navigate('/wallet')
    }
  ];

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-white/10 rounded mb-2"></div>
                    <div className="h-8 bg-white/10 rounded mb-2"></div>
                    <div className="h-3 bg-white/10 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 pt-20 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {profile?.name || 'Trader'}! 
                <span className="ml-2">👋</span>
              </h1>
              <p className="text-purple-300">
                Your advanced trading & investment dashboard
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <Star className="h-3 w-3 mr-1" />
                Premium Trader
              </Badge>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <Activity className="h-3 w-3 mr-1" />
                Live Trading
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold">₹{dashboardStats.totalBalance.toLocaleString()}</p>
                  <p className="text-purple-100 text-sm">Available for trading</p>
                </div>
                <Wallet className="h-8 w-8 text-purple-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Today's P&L</p>
                  <p className={`text-2xl font-bold ${dashboardStats.todayPnL >= 0 ? 'text-white' : 'text-red-200'}`}>
                    ₹{dashboardStats.todayPnL.toFixed(2)}
                  </p>
                  <p className="text-green-100 text-sm">
                    {dashboardStats.activeTrades} active trades
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-red-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Win Rate</p>
                  <p className="text-2xl font-bold">{dashboardStats.winRate}%</p>
                  <p className="text-orange-100 text-sm">{dashboardStats.totalTrades} total trades</p>
                </div>
                <Trophy className="h-8 w-8 text-orange-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-600 to-purple-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{dashboardStats.totalEarnings.toLocaleString()}</p>
                  <p className="text-pink-100 text-sm">From investments & trading</p>
                </div>
                <DollarSign className="h-8 w-8 text-pink-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={index}
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                onClick={action.action}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color} group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{action.title}</h3>
                      <p className="text-purple-300 text-sm">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center">
              <PieChart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Trades</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Crypto</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdvancedDashboard />
          </TabsContent>

          <TabsContent value="trades">
            <div className="space-y-6">
              {/* Recent Trades */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Timer className="h-5 w-5 mr-2" />
                    Recent Trades
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    Your latest trading activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${
                            trade.result === 'win' ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            {trade.result === 'win' ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : (
                              <XCircle className="h-4 w-4 text-white" />
                            )}
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium">{trade.asset_symbol}</span>
                              <Badge className={trade.direction === 'UP' ? 'bg-green-600' : 'bg-red-600'}>
                                {trade.direction}
                              </Badge>
                            </div>
                            <p className="text-purple-300 text-sm">
                              Stake: ₹{trade.stake} • {getTimeAgo(trade.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-semibold ${
                            trade.result === 'win' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.result === 'win' ? '+' : '-'}₹{
                              trade.result === 'win' ? trade.payout.toFixed(2) : trade.stake.toFixed(2)
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/trading')}
                      className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
                    >
                      View All Trades
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300">Win Rate</span>
                      <span className="text-white font-semibold">{dashboardStats.winRate}%</span>
                    </div>
                    <Progress value={dashboardStats.winRate} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300">Total Trades</span>
                      <span className="text-white font-semibold">{dashboardStats.totalTrades}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300">Active Trades</span>
                      <span className="text-white font-semibold">{dashboardStats.activeTrades}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300">Avg. Win</span>
                      <span className="text-green-400 font-semibold">+₹45.50</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Trading Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Signal className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-400 font-medium">Best Performing Asset</span>
                      </div>
                      <p className="text-white">EURUSD - 85% win rate</p>
                    </div>
                    
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 font-medium">Profitable Streak</span>
                      </div>
                      <p className="text-white">5 consecutive wins</p>
                    </div>
                    
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="h-4 w-4 text-purple-400" />
                        <span className="text-purple-400 font-medium">AI Recommendation</span>
                      </div>
                      <p className="text-white">Focus on forex pairs during EU session</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="crypto">
            <CryptoTradingWidget />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSystem />
          </TabsContent>

          <TabsContent value="ai-insights">
            <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI-Powered Trading Insights
                  <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    Premium Feature
                  </Badge>
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Advanced AI analysis and personalized trading recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Market Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">Market Sentiment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-purple-300">Overall Market:</span>
                          <Badge className="bg-green-600">Bullish</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Volatility:</span>
                          <Badge className="bg-yellow-600">Moderate</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Trend Strength:</span>
                          <Badge className="bg-blue-600">Strong</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">Risk Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-purple-300">Portfolio Risk:</span>
                          <Badge className="bg-yellow-600">Medium</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Diversification:</span>
                          <Badge className="bg-green-600">Good</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Exposure:</span>
                          <Badge className="bg-orange-600">Balanced</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">Performance Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-400">85</div>
                        <p className="text-purple-300 text-sm">Out of 100</p>
                        <Progress value={85} className="h-2 mt-2" />
                        <p className="text-purple-300 text-xs mt-1">Excellent Performance</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Recommendations */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">AI Trading Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">Strong Buy: EURUSD</h4>
                          <Badge className="bg-green-600">95% Confidence</Badge>
                        </div>
                        <p className="text-green-400 text-sm">
                          Technical indicators strongly favor upward movement. RSI oversold, MACD bullish crossover.
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-purple-300">
                          <span>Target: 1.0950 (+0.92%)</span>
                          <span>Risk: Low</span>
                          <span>Timeframe: 1-3 hours</span>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">Hold: BTCUSD</h4>
                          <Badge className="bg-blue-600">78% Confidence</Badge>
                        </div>
                        <p className="text-blue-400 text-sm">
                          Consolidation phase expected. Wait for breakout above $43,500 resistance level.
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-purple-300">
                          <span>Support: $41,800</span>
                          <span>Resistance: $43,500</span>
                          <span>Trend: Sideways</span>
                        </div>
                      </div>

                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">Optimize Portfolio</h4>
                          <Badge className="bg-purple-600">Strategic</Badge>
                        </div>
                        <p className="text-purple-400 text-sm">
                          Consider reducing exposure to high-risk assets and increase allocation to stable forex pairs.
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-purple-300">
                          <span>Rebalance: Recommended</span>
                          <span>Risk Reduction: 15%</span>
                          <span>Expected ROI: +12%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Forecast */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">AI Performance Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">+22.5%</div>
                        <div className="text-purple-300 text-sm">1 Week Prediction</div>
                        <div className="text-purple-400 text-xs">High Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">+48.2%</div>
                        <div className="text-purple-300 text-sm">1 Month Prediction</div>
                        <div className="text-purple-400 text-xs">Medium Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">+124.8%</div>
                        <div className="text-purple-300 text-sm">3 Month Prediction</div>
                        <div className="text-purple-400 text-xs">Moderate Confidence</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-white/5 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Key Factors Influencing Forecast:</h4>
                      <ul className="text-purple-300 text-sm space-y-1">
                        <li>• Strong historical performance in similar market conditions</li>
                        <li>• Favorable macroeconomic indicators</li>
                        <li>• Improved risk management strategies</li>
                        <li>• Seasonal trading patterns alignment</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
