
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator as CalculatorIcon, ArrowLeft, TrendingUp, DollarSign, Calendar, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

const Calculator = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [roiPercent, setRoiPercent] = useState('');
  const [calculationType, setCalculationType] = useState('roi');
  const [results, setResults] = useState<any>(null);

  const calculateROI = () => {
    const principal = parseFloat(amount);
    const days = parseInt(duration);
    const dailyRoi = parseFloat(roiPercent);

    if (!principal || !days || !dailyRoi) return;

    const dailyReturn = (principal * dailyRoi) / 100;
    const totalReturn = dailyReturn * days;
    const totalAmount = principal + totalReturn;
    const monthlyReturn = dailyReturn * 30;
    const yearlyReturn = dailyReturn * 365;

    setResults({
      principal,
      dailyReturn,
      monthlyReturn,
      yearlyReturn,
      totalReturn,
      totalAmount,
      duration: days,
      roiPercent: dailyRoi
    });
  };

  const calculateCompound = () => {
    const principal = parseFloat(amount);
    const rate = parseFloat(roiPercent) / 100;
    const time = parseInt(duration) / 365; // Convert days to years
    const n = 365; // Compound daily

    if (!principal || !rate || !time) return;

    const compoundAmount = principal * Math.pow((1 + rate / n), n * time);
    const compoundInterest = compoundAmount - principal;

    setResults({
      principal,
      compoundAmount,
      compoundInterest,
      duration: parseInt(duration),
      rate: parseFloat(roiPercent)
    });
  };

  const calculateSIP = () => {
    const monthlyAmount = parseFloat(amount);
    const months = parseInt(duration);
    const annualRate = parseFloat(roiPercent) / 100;
    const monthlyRate = annualRate / 12;

    if (!monthlyAmount || !months || !annualRate) return;

    const maturityAmount = monthlyAmount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    const totalInvestment = monthlyAmount * months;
    const totalReturns = maturityAmount - totalInvestment;

    setResults({
      monthlyAmount,
      totalInvestment,
      maturityAmount,
      totalReturns,
      duration: months,
      rate: parseFloat(roiPercent)
    });
  };

  const handleCalculate = () => {
    switch (calculationType) {
      case 'roi':
        calculateROI();
        break;
      case 'compound':
        calculateCompound();
        break;
      case 'sip':
        calculateSIP();
        break;
      default:
        calculateROI();
    }
  };

  const resetCalculator = () => {
    setAmount('');
    setDuration('');
    setRoiPercent('');
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Investment Calculator</h1>
                <p className="text-purple-300">Calculate your investment returns</p>
              </div>
            </div>
          </div>

          {/* Calculator Type Selection */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CalculatorIcon className="h-5 w-5 mr-2" />
                Calculator Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={calculationType} onValueChange={setCalculationType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select calculator type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="roi">ROI Calculator</SelectItem>
                  <SelectItem value="compound">Compound Interest</SelectItem>
                  <SelectItem value="sip">SIP Calculator</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Input Form */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Input Parameters</CardTitle>
              <CardDescription className="text-purple-300">
                Enter the values to calculate your returns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-white">
                    {calculationType === 'sip' ? 'Monthly Amount (₹)' : 'Investment Amount (₹)'}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className="text-white">
                    {calculationType === 'sip' ? 'Duration (Months)' : 'Duration (Days)'}
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder={calculationType === 'sip' ? '12' : '365'}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="roi" className="text-white">
                    {calculationType === 'roi' ? 'Daily ROI (%)' : 'Annual Rate (%)'}
                  </Label>
                  <Input
                    id="roi"
                    type="number"
                    step="0.01"
                    placeholder="1.5"
                    value={roiPercent}
                    onChange={(e) => setRoiPercent(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <Button 
                  onClick={handleCalculate}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Calculate
                </Button>
                <Button 
                  onClick={resetCalculator}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <div className="grid md:grid-cols-2 gap-6">
              {calculationType === 'roi' && (
                <>
                  <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Daily Return</p>
                          <p className="text-3xl font-bold">₹{results.dailyReturn.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-12 w-12 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Monthly Return</p>
                          <p className="text-3xl font-bold">₹{results.monthlyReturn.toLocaleString()}</p>
                        </div>
                        <Calendar className="h-12 w-12 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">Total Return</p>
                          <p className="text-3xl font-bold">₹{results.totalReturn.toLocaleString()}</p>
                        </div>
                        <TrendingUp className="h-12 w-12 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm">Final Amount</p>
                          <p className="text-3xl font-bold">₹{results.totalAmount.toLocaleString()}</p>
                        </div>
                        <Target className="h-12 w-12 text-orange-200" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {calculationType === 'compound' && (
                <>
                  <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-green-100 text-sm">Principal Amount</p>
                        <p className="text-3xl font-bold">₹{results.principal.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 text-white">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-blue-100 text-sm">Compound Interest</p>
                        <p className="text-3xl font-bold">₹{results.compoundInterest.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 text-white md:col-span-2">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-purple-100 text-sm">Final Amount</p>
                        <p className="text-4xl font-bold">₹{results.compoundAmount.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {calculationType === 'sip' && (
                <>
                  <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-green-100 text-sm">Total Investment</p>
                        <p className="text-3xl font-bold">₹{results.totalInvestment.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 text-white">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-blue-100 text-sm">Total Returns</p>
                        <p className="text-3xl font-bold">₹{results.totalReturns.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 text-white md:col-span-2">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-purple-100 text-sm">Maturity Amount</p>
                        <p className="text-4xl font-bold">₹{results.maturityAmount.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Quick Tips */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Investment Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-purple-300 text-sm">
                <div>
                  <h4 className="text-white font-semibold mb-2">ROI Calculator</h4>
                  <p>Calculate daily returns based on fixed percentage. Best for understanding consistent daily income from investments.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Compound Interest</h4>
                  <p>See how your money grows when returns are reinvested. The power of compounding over time.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">SIP Calculator</h4>
                  <p>Systematic Investment Plan calculator for regular monthly investments. Great for disciplined investing.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Investment Strategy</h4>
                  <p>Diversify your portfolio and invest regularly. Always consider your risk tolerance before investing.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Calculator;
