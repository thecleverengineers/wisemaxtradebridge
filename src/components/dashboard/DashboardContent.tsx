
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Gift
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedDashboard } from './AdvancedDashboard';
import { CryptoTradingWidget } from './CryptoTradingWidget';
import { ReferralSystem } from './ReferralSystem';
import { PaymentIntegration } from './PaymentIntegration';

export const DashboardContent = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex-1 p-4 pt-20 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {profile?.name || 'Investor'}! 
                <span className="ml-2">👋</span>
              </h1>
              <p className="text-purple-300">
                Your trading & investment dashboard
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <Star className="h-3 w-3 mr-1" />
                Premium Member
              </Badge>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <Activity className="h-3 w-3 mr-1" />
                Active
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
                  <p className="text-purple-100 text-sm">Total Portfolio</p>
                  <p className="text-2xl font-bold">₹1,25,000</p>
                  <p className="text-purple-100 text-sm">+12.5% today</p>
                </div>
                <PieChart className="h-8 w-8 text-purple-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Investments</p>
                  <p className="text-2xl font-bold">₹85,000</p>
                  <p className="text-green-100 text-sm">8 plans active</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-red-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Crypto Holdings</p>
                  <p className="text-2xl font-bold">₹25,000</p>
                  <p className="text-orange-100 text-sm">5 cryptocurrencies</p>
                </div>
                <Activity className="h-8 w-8 text-orange-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-600 to-purple-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Referral Earnings</p>
                  <p className="text-2xl font-bold">₹15,750</p>
                  <p className="text-pink-100 text-sm">42 referrals</p>
                </div>
                <Users className="h-8 w-8 text-pink-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center">
              <PieChart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Crypto</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdvancedDashboard />
          </TabsContent>

          <TabsContent value="crypto">
            <CryptoTradingWidget />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSystem />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentIntegration />
          </TabsContent>

          <TabsContent value="ai-insights">
            <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI-Powered Investment Insights
                  <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    Premium Feature
                  </Badge>
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Get personalized investment recommendations powered by AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <span className="text-purple-300">Crypto Market:</span>
                          <Badge className="bg-yellow-600">Neutral</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Your Portfolio:</span>
                          <Badge className="bg-green-600">Strong</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">Risk Analysis</CardTitle>
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
                          <span className="text-purple-300">Volatility:</span>
                          <Badge className="bg-orange-600">Moderate</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Recommendations */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">AI Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">Strong Buy: RELIANCE</h4>
                          <Badge className="bg-green-600">90% Confidence</Badge>
                        </div>
                        <p className="text-green-400 text-sm">
                          Excellent quarterly results and strong fundamentals. Target: ₹3,100 (+8.9%)
                        </p>
                      </div>

                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">Hold: BITCOIN</h4>
                          <Badge className="bg-blue-600">75% Confidence</Badge>
                        </div>
                        <p className="text-blue-400 text-sm">
                          Consolidation phase expected. Wait for breakout above $70K resistance.
                        </p>
                      </div>

                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">Diversify: Add International Stocks</h4>
                          <Badge className="bg-purple-600">85% Confidence</Badge>
                        </div>
                        <p className="text-purple-400 text-sm">
                          Consider adding US tech stocks to reduce India-centric risk.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Prediction */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Portfolio Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">+18.5%</div>
                        <div className="text-purple-300 text-sm">1 Month Prediction</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">+35.2%</div>
                        <div className="text-purple-300 text-sm">6 Month Prediction</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">+62.8%</div>
                        <div className="text-purple-300 text-sm">1 Year Prediction</div>
                      </div>
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
