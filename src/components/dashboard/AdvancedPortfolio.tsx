
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Target, Brain, Shield, Zap, Globe } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdvancedPortfolio = () => {
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 125000,
    dailyPnL: 2150,
    totalPnL: 12500,
    riskScore: 6.5,
    aiConfidence: 87
  });

  const [positions, setPositions] = useState([
    { symbol: 'AAPL', name: 'Apple Inc.', quantity: 50, value: 8750, pnl: 450, pnlPercent: 5.4 },
    { symbol: 'TSLA', name: 'Tesla Inc.', quantity: 25, value: 18750, pnl: -320, pnlPercent: -1.7 },
    { symbol: 'BTC', name: 'Bitcoin', quantity: 0.5, value: 21500, pnl: 1200, pnlPercent: 5.9 },
    { symbol: 'NVDA', name: 'NVIDIA', quantity: 30, value: 15600, pnl: 890, pnlPercent: 6.0 }
  ]);

  const [aiPredictions, setAiPredictions] = useState([
    { asset: 'AAPL', signal: 'BUY', confidence: 92, timeframe: '1W', reason: 'Strong earnings momentum' },
    { asset: 'TSLA', signal: 'HOLD', confidence: 76, timeframe: '1M', reason: 'Mixed technical signals' },
    { asset: 'BTC', signal: 'BUY', confidence: 88, timeframe: '1D', reason: 'Institutional adoption' }
  ]);

  const chartData = [
    { name: 'Jan', value: 115000 },
    { name: 'Feb', value: 118000 },
    { name: 'Mar', value: 121000 },
    { name: 'Apr', value: 119500 },
    { name: 'May', value: 125000 }
  ];

  const allocationData = [
    { name: 'Stocks', value: 60, color: '#8884d8' },
    { name: 'Crypto', value: 25, color: '#82ca9d' },
    { name: 'ETFs', value: 10, color: '#ffc658' },
    { name: 'Cash', value: 5, color: '#ff7c7c' }
  ];

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioData.totalValue.toLocaleString()}</div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              +{((portfolioData.totalPnL / (portfolioData.totalValue - portfolioData.totalPnL)) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolioData.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${portfolioData.dailyPnL.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {portfolioData.dailyPnL >= 0 ? '+' : ''}{((portfolioData.dailyPnL / portfolioData.totalValue) * 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Brain className="w-4 h-4 mr-1" />
              AI Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioData.riskScore}/10</div>
            <Progress value={portfolioData.riskScore * 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="w-4 h-4 mr-1" />
              AI Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{portfolioData.aiConfidence}%</div>
            <div className="text-sm text-gray-500">Market Analysis</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="ai-signals">AI Signals</TabsTrigger>
          <TabsTrigger value="risk">Risk Mgmt</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="web3">Web3</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Portfolio Value']} />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions.map((position, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{position.symbol}</span>
                      </div>
                      <div>
                        <div className="font-medium">{position.name}</div>
                        <div className="text-sm text-gray-500">{position.quantity} shares</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${position.value.toLocaleString()}</div>
                      <div className={`text-sm ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-signals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI Trading Signals
              </CardTitle>
              <CardDescription>
                AI-powered predictions with confidence scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiPredictions.map((prediction, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant={prediction.signal === 'BUY' ? 'default' : prediction.signal === 'SELL' ? 'destructive' : 'secondary'}
                      >
                        {prediction.signal}
                      </Badge>
                      <div>
                        <div className="font-medium">{prediction.asset}</div>
                        <div className="text-sm text-gray-500">{prediction.timeframe} • {prediction.reason}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">{prediction.confidence}%</div>
                      <div className="text-sm text-gray-500">Confidence</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Risk Management Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Value at Risk (VaR)</div>
                  <div className="text-2xl font-bold text-green-800">$2,150</div>
                  <div className="text-sm text-green-600">1-day, 95% confidence</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Max Drawdown</div>
                  <div className="text-2xl font-bold text-blue-800">-8.5%</div>
                  <div className="text-sm text-blue-600">Last 30 days</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Sharpe Ratio</div>
                  <div className="text-2xl font-bold text-purple-800">1.85</div>
                  <div className="text-sm text-purple-600">Risk-adjusted return</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Black Swan Protection</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto Stop-Loss</span>
                  <Badge variant="secondary">Configured</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Position Size Limit</span>
                  <span className="text-sm text-gray-600">10% per asset</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Investment Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Retirement Fund</h3>
                    <Badge variant="default">On Track</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>$125,000 / $500,000</span>
                    </div>
                    <Progress value={25} />
                    <div className="text-sm text-gray-500">Target: Dec 2045 • Monthly: $1,200</div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">House Down Payment</h3>
                    <Badge variant="secondary">Behind</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>$35,000 / $100,000</span>
                    </div>
                    <Progress value={35} />
                    <div className="text-sm text-gray-500">Target: Dec 2026 • Monthly: $800</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="web3" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Web3 & DeFi Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">MetaMask Wallet</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="text-sm text-gray-500">0x742d...4a7c</div>
                  <div className="text-sm font-medium mt-2">$18,750 ETH</div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">DeFi Positions</span>
                    <Badge variant="secondary">3 Active</Badge>
                  </div>
                  <div className="text-sm text-gray-500">Uniswap, Compound, Aave</div>
                  <div className="text-sm font-medium mt-2 text-green-600">+12.5% APY</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">NFT Holdings</h4>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((nft) => (
                    <div key={nft} className="aspect-square bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">NFT #{nft}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedPortfolio;
