import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  Users, 
  Activity,
  PieChart,
  BarChart3,
  Zap,
  Target,
  Award,
  Brain,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar, Pie } from 'recharts';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

interface PortfolioData {
  totalValue: number;
  totalInvestment: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
}

interface AIRecommendation {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  targetPrice: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const mockMarketData: MarketData[] = [
  { symbol: 'NIFTY 50', price: 21580.35, change: 145.20, changePercent: 0.68, volume: 1250000, marketCap: 0 },
  { symbol: 'SENSEX', price: 71482.75, change: 298.45, changePercent: 0.42, volume: 980000, marketCap: 0 },
  { symbol: 'RELIANCE', price: 2847.60, change: -12.30, changePercent: -0.43, volume: 45000, marketCap: 1925000000000 },
  { symbol: 'TCS', price: 3965.25, change: 28.75, changePercent: 0.73, volume: 32000, marketCap: 1450000000000 },
  { symbol: 'HDFC BANK', price: 1682.90, change: 15.60, changePercent: 0.94, volume: 67000, marketCap: 1280000000000 },
  { symbol: 'BITCOIN', price: 67845.32, change: 1250.45, changePercent: 1.88, volume: 28000, marketCap: 1340000000000 },
  { symbol: 'ETHEREUM', price: 3456.78, change: -45.23, changePercent: -1.29, volume: 125000, marketCap: 415000000000 },
  { symbol: 'BNB', price: 628.45, change: 12.34, changePercent: 2.00, volume: 85000, marketCap: 94000000000 },
];

const aiRecommendations: AIRecommendation[] = [
  {
    id: '1',
    symbol: 'RELIANCE',
    action: 'BUY',
    confidence: 85,
    reason: 'Strong quarterly results and upcoming projects in renewable energy',
    targetPrice: 3100,
    riskLevel: 'MEDIUM'
  },
  {
    id: '2',
    symbol: 'BITCOIN',
    action: 'HOLD',
    confidence: 72,
    reason: 'Consolidation phase, wait for clear breakout above $70K',
    targetPrice: 75000,
    riskLevel: 'HIGH'
  },
  {
    id: '3',
    symbol: 'TCS',
    action: 'BUY',
    confidence: 90,
    reason: 'Excellent digital transformation deals and strong client addition',
    targetPrice: 4200,
    riskLevel: 'LOW'
  }
];

const portfolioData: PortfolioData = {
  totalValue: 125000,
  totalInvestment: 100000,
  totalPnL: 25000,
  totalPnLPercent: 25.0,
  dayPnL: 1500,
  dayPnLPercent: 1.2
};

const chartData = [
  { name: 'Jan', value: 85000 },
  { name: 'Feb', value: 92000 },
  { name: 'Mar', value: 88000 },
  { name: 'Apr', value: 115000 },
  { name: 'May', value: 108000 },
  { name: 'Jun', value: 125000 },
];

const pieData = [
  { name: 'Stocks', value: 60, color: '#3b82f6' },
  { name: 'Crypto', value: 25, color: '#f59e0b' },
  { name: 'Bonds', value: 10, color: '#10b981' },
  { name: 'Cash', value: 5, color: '#6b7280' },
];

export const AdvancedDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [marketData, setMarketData] = useState<MarketData[]>(mockMarketData);

  useEffect(() => {
    // Simulate real-time market data updates
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(item => ({
        ...item,
        price: item.price + (Math.random() - 0.5) * 10,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 2
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Value</p>
                <p className="text-2xl font-bold">₹{portfolioData.totalValue.toLocaleString()}</p>
              </div>
              <Wallet className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total P&L</p>
                <p className="text-2xl font-bold">₹{portfolioData.totalPnL.toLocaleString()}</p>
                <p className="text-blue-100 text-sm">{portfolioData.totalPnLPercent > 0 ? '+' : ''}{portfolioData.totalPnLPercent}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Day P&L</p>
                <p className="text-2xl font-bold">₹{portfolioData.dayPnL.toLocaleString()}</p>
                <p className="text-purple-100 text-sm">{portfolioData.dayPnLPercent > 0 ? '+' : ''}{portfolioData.dayPnLPercent}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-600 to-red-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Investment</p>
                <p className="text-2xl font-bold">₹{portfolioData.totalInvestment.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Performance Chart */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Portfolio Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }} 
                    />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Asset Allocation */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="markets" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Live Market Data
              </CardTitle>
              <CardDescription className="text-purple-300">
                Real-time prices and market movements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {marketData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${item.change >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div>
                        <h4 className="text-white font-medium">{item.symbol}</h4>
                        <p className="text-purple-300 text-sm">Vol: {item.volume.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        {item.symbol.includes('BITCOIN') || item.symbol.includes('ETHEREUM') || item.symbol.includes('BNB') 
                          ? `$${item.price.toLocaleString()}` 
                          : `₹${item.price.toLocaleString()}`}
                      </p>
                      <p className={`text-sm ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI Strategy Recommendations
                <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </CardTitle>
              <CardDescription className="text-purple-300">
                Personalized investment recommendations based on AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiRecommendations.map((rec) => (
                <div key={rec.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-white font-semibold">{rec.symbol}</h4>
                      <Badge className={`
                        ${rec.action === 'BUY' ? 'bg-green-600' : 
                          rec.action === 'SELL' ? 'bg-red-600' : 'bg-yellow-600'}
                      `}>
                        {rec.action}
                      </Badge>
                      <Badge variant="outline" className={`
                        ${rec.riskLevel === 'LOW' ? 'border-green-500 text-green-400' :
                          rec.riskLevel === 'MEDIUM' ? 'border-yellow-500 text-yellow-400' :
                          'border-red-500 text-red-400'}
                      `}>
                        {rec.riskLevel} RISK
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">Target: ₹{rec.targetPrice.toLocaleString()}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-300 text-sm">Confidence:</span>
                        <Progress value={rec.confidence} className="w-16 h-2" />
                        <span className="text-white text-sm">{rec.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-purple-300 text-sm">{rec.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-purple-300">Portfolio Risk Score</span>
                      <span className="text-yellow-400">Medium (6.5/10)</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-purple-300">Diversification Score</span>
                      <span className="text-green-400">Good (7.8/10)</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-purple-300">Volatility Index</span>
                      <span className="text-orange-400">Moderate (5.2/10)</span>
                    </div>
                    <Progress value={52} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Annual Return</span>
                    <span className="text-green-400">+18.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Sharpe Ratio</span>
                    <span className="text-white">1.24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Max Drawdown</span>
                    <span className="text-red-400">-8.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Win Rate</span>
                    <span className="text-green-400">67%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Beta</span>
                    <span className="text-white">0.89</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
