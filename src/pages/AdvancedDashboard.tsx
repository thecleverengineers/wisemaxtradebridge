
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, TrendingUp, Brain, Users, Globe, Shield, Target } from 'lucide-react';
import AdvancedPortfolio from '@/components/dashboard/AdvancedPortfolio';
import AITradingAssistant from '@/components/dashboard/AITradingAssistant';
import SocialTrading from '@/components/dashboard/SocialTrading';
import Web3Integration from '@/components/dashboard/Web3Integration';
import RiskManagement from '@/components/dashboard/RiskManagement';

const AdvancedDashboard = () => {
  const [activeView, setActiveView] = useState('portfolio');

  const quickStats = {
    totalValue: 125000,
    dailyPnL: 2150,
    weeklyReturn: 8.7,
    monthlyReturn: 15.2,
    aiScore: 87,
    riskLevel: 6.5
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                InvestX Pro Dashboard
              </h1>
              <p className="text-gray-600 mt-1">AI-Powered Investment Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="default" className="bg-green-600">
                <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                Markets Open
              </Badge>
              <Button variant="outline">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Customize View
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Portfolio Value</div>
              <div className="text-xl font-bold">${quickStats.totalValue.toLocaleString()}</div>
              <div className="text-xs text-green-600">+{quickStats.monthlyReturn}% MTD</div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Daily P&L</div>
              <div className={`text-xl font-bold ${quickStats.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${quickStats.dailyPnL.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">+{quickStats.weeklyReturn}% WTD</div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">AI Score</div>
              <div className="text-xl font-bold text-purple-600">{quickStats.aiScore}%</div>
              <div className="text-xs text-purple-500">High Confidence</div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Risk Level</div>
              <div className="text-xl font-bold text-orange-600">{quickStats.riskLevel}/10</div>
              <div className="text-xs text-orange-500">Moderate</div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Copy Traders</div>
              <div className="text-xl font-bold text-blue-600">2</div>
              <div className="text-xs text-blue-500">Active</div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Web3 Value</div>
              <div className="text-xl font-bold text-cyan-600">$52K</div>
              <div className="text-xs text-cyan-500">+15.7%</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/60 backdrop-blur-sm">
            <TabsTrigger value="portfolio" className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="web3" className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Web3
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Risk
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Goals
            </TabsTrigger>
          </TabsList>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <TabsContent value="portfolio" className="mt-0">
              <AdvancedPortfolio />
            </TabsContent>

            <TabsContent value="ai-assistant" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AITradingAssistant />
                </div>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">Market Sentiment</div>
                        <div className="text-xs text-blue-600">Bullish momentum detected in tech sector</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-800">Portfolio Health</div>
                        <div className="text-xs text-green-600">Well-diversified, low correlation risk</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm font-medium text-purple-800">Recommendation</div>
                        <div className="text-xs text-purple-600">Consider DCA into emerging markets</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="mt-0">
              <SocialTrading />
            </TabsContent>

            <TabsContent value="web3" className="mt-0">
              <Web3Integration />
            </TabsContent>

            <TabsContent value="risk" className="mt-0">
              <RiskManagement />
            </TabsContent>

            <TabsContent value="goals" className="mt-0">
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Investment Goals</h3>
                <p className="text-gray-600 mb-6">
                  Set and track your financial objectives with AI-powered recommendations
                </p>
                <Button size="lg">
                  Create Your First Goal
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedDashboard;
