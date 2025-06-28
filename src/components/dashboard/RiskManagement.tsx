
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, TrendingDown, Settings, Bell, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const RiskManagement = () => {
  const [riskSettings, setRiskSettings] = useState({
    maxDailyLoss: 5,
    maxPositionSize: 10,
    blackSwanProtection: true,
    autoStopLoss: true,
    riskTolerance: 'moderate'
  });

  const riskMetrics = {
    currentVaR: 2150,
    maxDrawdown: 8.5,
    sharpeRatio: 1.85,
    beta: 1.2,
    alpha: 3.4,
    volatility: 18.7
  };

  const portfolioRisk = {
    overallScore: 6.5,
    diversificationScore: 8.2,
    liquidityRisk: 3.1,
    concentrationRisk: 7.8
  };

  const historicalDrawdown = [
    { date: 'Jan', drawdown: -2.1 },
    { date: 'Feb', drawdown: -4.3 },
    { date: 'Mar', drawdown: -1.8 },
    { date: 'Apr', drawdown: -8.5 },
    { date: 'May', drawdown: -3.2 }
  ];

  const riskAlerts = [
    {
      type: 'high',
      message: 'Tech sector exposure exceeds 35% limit',
      timestamp: '2 hours ago',
      action: 'Rebalance Portfolio'
    },
    {
      type: 'medium',
      message: 'Bitcoin position approaching stop-loss',
      timestamp: '4 hours ago',
      action: 'Monitor Position'
    },
    {
      type: 'low',
      message: 'Portfolio correlation increased to 0.8',
      timestamp: '1 day ago',
      action: 'Review Diversification'
    }
  ];

  const stressTests = [
    { scenario: 'Market Crash (-20%)', impact: '-$25,000', probability: '5%' },
    { scenario: 'Tech Sector Collapse (-50%)', impact: '-$43,750', probability: '2%' },
    { scenario: 'Interest Rate Spike (+3%)', impact: '-$12,500', probability: '15%' },
    { scenario: 'Inflation Surge (+5%)', impact: '-$18,200', probability: '8%' }
  ];

  const handleRiskSettingChange = (key: string, value: any) => {
    setRiskSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Shield className="w-7 h-7 mr-2 text-blue-600" />
            Risk Management Center
          </h2>
          <p className="text-gray-600">Monitor and control your portfolio risk exposure</p>
        </div>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Risk Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`${portfolioRisk.overallScore <= 3 ? 'bg-green-50 border-green-200' : 
                          portfolioRisk.overallScore <= 7 ? 'bg-yellow-50 border-yellow-200' : 
                          'bg-red-50 border-red-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioRisk.overallScore}/10</div>
            <Progress value={portfolioRisk.overallScore * 10} className="mt-2" />
            <div className="text-xs text-gray-600 mt-1">
              {portfolioRisk.overallScore <= 3 ? 'Conservative' : 
               portfolioRisk.overallScore <= 7 ? 'Moderate' : 'Aggressive'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Value at Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${riskMetrics.currentVaR.toLocaleString()}</div>
            <div className="text-xs text-gray-600">1-day, 95% confidence</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{riskMetrics.maxDrawdown}%</div>
            <div className="text-xs text-gray-600">Last 30 days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{riskMetrics.sharpeRatio}</div>
            <div className="text-xs text-gray-600">Risk-adjusted return</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Risk Alerts</TabsTrigger>
          <TabsTrigger value="stress">Stress Tests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Diversification Score</span>
                    <span className="text-sm font-bold text-green-600">{portfolioRisk.diversificationScore}/10</span>
                  </div>
                  <Progress value={portfolioRisk.diversificationScore * 10} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Liquidity Risk</span>
                    <span className="text-sm font-bold text-green-600">{portfolioRisk.liquidityRisk}/10</span>
                  </div>
                  <Progress value={portfolioRisk.liquidityRisk * 10} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Concentration Risk</span>
                    <span className="text-sm font-bold text-orange-600">{portfolioRisk.concentrationRisk}/10</span>
                  </div>
                  <Progress value={portfolioRisk.concentrationRisk * 10} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historical Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={historicalDrawdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Drawdown']} />
                    <Bar dataKey="drawdown" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Risk Metrics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Beta</div>
                  <div className="text-2xl font-bold">{riskMetrics.beta}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Alpha</div>
                  <div className="text-2xl font-bold text-green-600">{riskMetrics.alpha}%</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Volatility</div>
                  <div className="text-2xl font-bold">{riskMetrics.volatility}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Active Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      alert.type === 'high' ? 'bg-red-100 text-red-600' :
                      alert.type === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={
                          alert.type === 'high' ? 'destructive' :
                          alert.type === 'medium' ? 'default' : 'secondary'
                        }>
                          {alert.type.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">{alert.timestamp}</span>
                      </div>
                      <p className="text-sm font-medium mb-2">{alert.message}</p>
                      <Button variant="outline" size="sm">
                        {alert.action}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stress Test Scenarios</CardTitle>
              <CardDescription>Potential portfolio impact under adverse market conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stressTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{test.scenario}</div>
                      <div className="text-sm text-gray-600">Probability: {test.probability}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">{test.impact}</div>
                      <Button variant="outline" size="sm" className="mt-1">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management Settings</CardTitle>
              <CardDescription>Configure your risk parameters and protection rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxDailyLoss">Maximum Daily Loss (%)</Label>
                  <Input
                    id="maxDailyLoss"
                    type="number"
                    value={riskSettings.maxDailyLoss}
                    onChange={(e) => handleRiskSettingChange('maxDailyLoss', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxPositionSize">Maximum Position Size (%)</Label>
                  <Input
                    id="maxPositionSize"
                    type="number"
                    value={riskSettings.maxPositionSize}
                    onChange={(e) => handleRiskSettingChange('maxPositionSize', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Black Swan Protection</Label>
                    <p className="text-sm text-gray-600">Automatic hedging during market crashes</p>
                  </div>
                  <Switch
                    checked={riskSettings.blackSwanProtection}
                    onCheckedChange={(checked) => handleRiskSettingChange('blackSwanProtection', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Stop-Loss</Label>
                    <p className="text-sm text-gray-600">Automatically execute stop-loss orders</p>
                  </div>
                  <Switch
                    checked={riskSettings.autoStopLoss}
                    onCheckedChange={(checked) => handleRiskSettingChange('autoStopLoss', checked)}
                  />
                </div>
              </div>

              <Button className="w-full">
                Save Risk Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Reports</CardTitle>
              <CardDescription>Download detailed risk analysis reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="p-6 h-auto">
                  <div className="text-center">
                    <Target className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-medium">Daily Risk Report</div>
                    <div className="text-sm text-gray-600">VaR, drawdown, and exposure analysis</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="p-6 h-auto">
                  <div className="text-center">
                    <TrendingDown className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-medium">Stress Test Report</div>
                    <div className="text-sm text-gray-600">Scenario analysis and impact assessment</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskManagement;
