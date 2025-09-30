import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  TrendingUp, Clock, Calendar, DollarSign, Calculator, 
  Activity, Target, PiggyBank, RefreshCw, Download,
  ChevronRight, Info, Shield, Award, Wallet
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, addDays, addMonths, addYears, differenceInHours, differenceInDays } from 'date-fns';

interface ROIPlan {
  id: string;
  name: string;
  duration_type: string;
  duration_value: number;
  min_investment: number;
  max_investment?: number;
  interest_rate: number;
  is_compounding: boolean;
  allow_early_withdrawal: boolean;
  withdrawal_penalty: number;
  is_active: boolean;
  description?: string;
  features?: any; // JSON type from Supabase
}

interface UserInvestment {
  id: string;
  plan_id: string;
  amount: number;
  custom_interest_rate?: number;
  start_date: string;
  maturity_date: string;
  current_value: number;
  total_withdrawn: number;
  status: string;
  auto_reinvest: boolean;
  plan?: ROIPlan;
}

interface ROIEarning {
  id: string;
  amount: number;
  earning_type: string;
  calculation_date: string;
}

export default function ROIInvestments() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<ROIPlan[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [earnings, setEarnings] = useState<ROIEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ROIPlan | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [autoReinvest, setAutoReinvest] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState('1000');
  const [calculatorDuration, setCalculatorDuration] = useState('30');
  const [calculatorRate, setCalculatorRate] = useState('2');
  const [calculatorType, setCalculatorType] = useState('daily');

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('roi-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_roi_investments',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchUserInvestments();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'roi_earnings',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchEarnings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPlans(),
      fetchUserInvestments(),
      fetchEarnings()
    ]);
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('roi_plans')
      .select('*')
      .eq('is_active', true)
      .order('min_investment', { ascending: true });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch investment plans",
        variant: "destructive"
      });
    } else {
      setPlans(data || []);
    }
  };

  const fetchUserInvestments = async () => {
    const { data, error } = await supabase
      .from('user_roi_investments')
      .select(`
        *,
        plan:roi_plans(*)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your investments",
        variant: "destructive"
      });
    } else {
      setUserInvestments(data || []);
    }
  };

  const fetchEarnings = async () => {
    const { data, error } = await supabase
      .from('roi_earnings')
      .select('*')
      .eq('user_id', user?.id)
      .order('calculation_date', { ascending: false })
      .limit(30);
    
    if (error) {
      console.error('Error fetching earnings:', error);
    } else {
      setEarnings(data || []);
    }
  };

  const calculateMaturityDate = (plan: ROIPlan) => {
    const now = new Date();
    switch (plan.duration_type) {
      case 'hourly':
        return addDays(now, plan.duration_value / 24);
      case 'daily':
        return addDays(now, plan.duration_value);
      case 'monthly':
        return addMonths(now, plan.duration_value);
      case 'quarterly':
        return addMonths(now, plan.duration_value * 3);
      case 'yearly':
        return addYears(now, plan.duration_value);
      default:
        return addDays(now, plan.duration_value);
    }
  };

  const calculateROI = () => {
    const amount = parseFloat(calculatorAmount) || 0;
    const duration = parseFloat(calculatorDuration) || 1;
    const rate = parseFloat(calculatorRate) || 0;
    
    let periods = duration;
    if (calculatorType === 'hourly') periods = duration * 24;
    if (calculatorType === 'monthly') periods = duration / 30;
    if (calculatorType === 'quarterly') periods = duration / 90;
    if (calculatorType === 'yearly') periods = duration / 365;
    
    const totalReturn = amount * (rate / 100) * periods;
    const finalAmount = amount + totalReturn;
    
    return {
      principal: amount,
      returns: totalReturn,
      total: finalAmount,
      roi: (totalReturn / amount) * 100
    };
  };

  const generateChartData = () => {
    const calc = calculateROI();
    const amount = parseFloat(calculatorAmount) || 0;
    const duration = parseFloat(calculatorDuration) || 1;
    const rate = parseFloat(calculatorRate) || 0;
    
    const data = [];
    for (let i = 0; i <= duration; i++) {
      const dayReturn = amount * (rate / 100) * i;
      data.push({
        day: i,
        value: amount + dayReturn,
        returns: dayReturn
      });
    }
    return data;
  };

  const handleInvest = async () => {
    if (!selectedPlan || !investmentAmount) {
      toast({
        title: "Error",
        description: "Please select a plan and enter an amount",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (amount < selectedPlan.min_investment || (selectedPlan.max_investment && amount > selectedPlan.max_investment)) {
      toast({
        title: "Invalid Amount",
        description: `Amount must be between ${selectedPlan.min_investment} and ${selectedPlan.max_investment || 'unlimited'}`,
        variant: "destructive"
      });
      return;
    }

    const maturityDate = calculateMaturityDate(selectedPlan);
    
    const { error } = await supabase
      .from('user_roi_investments')
      .insert({
        user_id: user?.id,
        plan_id: selectedPlan.id,
        amount: amount,
        custom_interest_rate: useCustomRate ? parseFloat(customRate) : null,
        maturity_date: maturityDate.toISOString(),
        current_value: amount,
        auto_reinvest: autoReinvest,
        status: 'active'
      });

    if (error) {
      toast({
        title: "Investment Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Investment Successful",
        description: `You've invested ${amount} in ${selectedPlan.name}`,
      });
      setInvestmentAmount('');
      setCustomRate('');
      setUseCustomRate(false);
      setAutoReinvest(false);
      setSelectedPlan(null);
      fetchUserInvestments();
    }
  };

  const handleWithdraw = async (investment: UserInvestment) => {
    if (!investment.plan?.allow_early_withdrawal && investment.status === 'active') {
      toast({
        title: "Withdrawal Not Allowed",
        description: "This plan doesn't allow early withdrawals",
        variant: "destructive"
      });
      return;
    }

    const penalty = investment.plan?.withdrawal_penalty || 0;
    const withdrawAmount = investment.current_value * (1 - penalty / 100);

    const { error } = await supabase
      .from('roi_withdrawals')
      .insert({
        investment_id: investment.id,
        user_id: user?.id,
        amount: withdrawAmount,
        withdrawal_type: 'full',
        penalty_amount: investment.current_value * (penalty / 100),
        status: 'pending'
      });

    if (error) {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Withdrawal Requested",
        description: `Withdrawal of ${withdrawAmount.toFixed(2)} USDT has been requested`,
      });
      
      // Update investment status
      await supabase
        .from('user_roi_investments')
        .update({ status: 'withdrawn' })
        .eq('id', investment.id);
      
      fetchUserInvestments();
    }
  };

  const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalValue = userInvestments.reduce((sum, inv) => sum + inv.current_value, 0);
  const totalEarnings = totalValue - totalInvested;
  const activeInvestments = userInvestments.filter(inv => inv.status === 'active').length;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold">${totalInvested.toFixed(2)}</p>
              </div>
              <PiggyBank className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">+${totalEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Plans</p>
                <p className="text-2xl font-bold">{activeInvestments}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans">Investment Plans</TabsTrigger>
          <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
          <TabsTrigger value="calculator">ROI Calculator</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Investment Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all ${selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge variant={plan.is_compounding ? "default" : "secondary"}>
                      {plan.is_compounding ? "Compound" : "Simple"}
                    </Badge>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Interest Rate</span>
                      <span className="font-semibold text-green-600">{plan.interest_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Duration</span>
                      <span className="font-medium">
                        {plan.duration_value} {plan.duration_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Min Investment</span>
                      <span className="font-medium">${plan.min_investment}</span>
                    </div>
                    {plan.max_investment && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Max Investment</span>
                        <span className="font-medium">${plan.max_investment}</span>
                      </div>
                    )}
                  </div>
                  
                  {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                    <div className="space-y-1">
                      {(plan.features as string[]).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3 text-primary" />
                          <span className="text-xs">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {plan.allow_early_withdrawal ? (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Early withdrawal ({plan.withdrawal_penalty}% penalty)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Info className="h-3 w-3 mr-1" />
                        Lock-in period
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Investment Form */}
          {selectedPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Invest in {selectedPlan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Investment Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder={`Min: $${selectedPlan.min_investment}`}
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                    />
                  </div>
                  
                  {selectedPlan.duration_type === 'custom' && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={useCustomRate}
                          onCheckedChange={setUseCustomRate}
                        />
                        <Label>Use Custom Interest Rate</Label>
                      </div>
                      {useCustomRate && (
                        <Input
                          type="number"
                          placeholder="Custom rate %"
                          value={customRate}
                          onChange={(e) => setCustomRate(e.target.value)}
                        />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoReinvest}
                    onCheckedChange={setAutoReinvest}
                  />
                  <Label>Auto-reinvest on maturity</Label>
                </div>
                
                <Button 
                  onClick={handleInvest} 
                  className="w-full"
                  disabled={!investmentAmount || parseFloat(investmentAmount) < selectedPlan.min_investment}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Invest Now
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Investments</CardTitle>
              <CardDescription>Track your current ROI investments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userInvestments.filter(inv => inv.status === 'active').map((investment) => {
                  const progress = investment.plan ? 
                    ((new Date().getTime() - new Date(investment.start_date).getTime()) / 
                    (new Date(investment.maturity_date).getTime() - new Date(investment.start_date).getTime())) * 100 
                    : 0;
                  
                  return (
                    <Card key={investment.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{investment.plan?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Started {format(new Date(investment.start_date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                            {investment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Invested</p>
                            <p className="font-semibold">${investment.amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Value</p>
                            <p className="font-semibold text-green-600">${investment.current_value.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">ROI</p>
                            <p className="font-semibold text-green-600">
                              +{((investment.current_value - investment.amount) / investment.amount * 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress to Maturity</span>
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Matures on {format(new Date(investment.maturity_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          {investment.plan?.allow_early_withdrawal && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleWithdraw(investment)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Withdraw
                            </Button>
                          )}
                          {investment.auto_reinvest && (
                            <Badge variant="outline" className="ml-auto">
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Auto-reinvest
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
                
                {userInvestments.filter(inv => inv.status === 'active').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No active investments yet. Start investing to see them here!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ROI Calculator</CardTitle>
              <CardDescription>Calculate your potential returns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Investment Amount</Label>
                  <Input
                    type="number"
                    value={calculatorAmount}
                    onChange={(e) => setCalculatorAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    type="number"
                    value={calculatorDuration}
                    onChange={(e) => setCalculatorDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    value={calculatorRate}
                    onChange={(e) => setCalculatorRate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration Type</Label>
                  <Select value={calculatorType} onValueChange={setCalculatorType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Principal</p>
                    <p className="text-xl font-bold">${calculateROI().principal.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Returns</p>
                    <p className="text-xl font-bold text-green-600">+${calculateROI().returns.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">${calculateROI().total.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">ROI %</p>
                    <p className="text-xl font-bold text-green-600">{calculateROI().roi.toFixed(2)}%</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Growth Chart</CardTitle>
                <CardDescription>Projected value over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={generateChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                      name="Total Value"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="returns" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                      name="Returns"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
                <CardDescription>Recent earnings from investments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={earnings.slice(0, 10).reverse().map(e => ({
                    date: format(new Date(e.calculation_date), 'MMM dd'),
                    amount: e.amount,
                    type: e.earning_type
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" name="Earnings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}