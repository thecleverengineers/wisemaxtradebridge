import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, Clock, Target, DollarSign, ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface InvestmentPlan {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  daily_roi: number;
  duration_days: number;
  total_return_percent: number;
  description: string;
}

interface UserInvestment {
  id: string;
  amount: number;
  plan_name: string;
  daily_return: number;
  total_return: number;
  duration_days: number;
  started_at: string;
  expires_at: string;
  status: string;
  total_paid_out: number;
  last_payout_at: string | null;
}

const Invest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch investment plans
      const { data: plansData, error: plansError } = await supabase
        .from('investment_plans')
        .select('*')
        .order('min_amount');

      if (plansError) throw plansError;
      setInvestmentPlans(plansData || []);

      // Fetch user's investments from roi_investments table
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('roi_investments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (investmentsError) throw investmentsError;
      
      setUserInvestments(investmentsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load investment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    if (!selectedPlan || !investAmount || !user) return;

    const amount = parseFloat(investAmount);
    if (amount < selectedPlan.min_amount || (selectedPlan.max_amount && amount > selectedPlan.max_amount)) {
      toast({
        title: "Invalid Amount",
        description: `Investment amount must be between ₹${selectedPlan.min_amount.toLocaleString()} and ₹${selectedPlan.max_amount?.toLocaleString() || 'unlimited'}`,
        variant: "destructive",
      });
      return;
    }

    setInvesting(true);
    try {
      const startDate = new Date();
      const expiresAt = new Date(Date.now() + selectedPlan.duration_days * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('roi_investments')
        .insert({
          user_id: user.id,
          plan_name: selectedPlan.name,
          amount,
          daily_return: selectedPlan.daily_roi,
          total_return: amount * (selectedPlan.total_return_percent / 100),
          duration_days: selectedPlan.duration_days,
          started_at: startDate.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Investment Successful!",
        description: `You have successfully invested ₹${amount.toLocaleString()} in ${selectedPlan.name}`,
      });

      setInvestAmount('');
      setSelectedPlan(null);
      fetchData();
    } catch (error) {
      console.error('Error creating investment:', error);
      toast({
        title: "Investment Failed",
        description: "Failed to create investment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInvesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-sm">IX</span>
          </div>
          <p>Loading investments...</p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-white">Investment Plans</h1>
                <p className="text-purple-300">Choose your investment strategy</p>
              </div>
            </div>
          </div>

          {/* Investment Plans */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {investmentPlans.map((plan) => (
              <Card key={plan.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    {plan.name}
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                      {plan.daily_roi}% Daily
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    {plan.description || 'Premium investment plan with guaranteed returns'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-purple-300">Min Amount</p>
                      <p className="text-white font-semibold">₹{plan.min_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-purple-300">Duration</p>
                      <p className="text-white font-semibold">{plan.duration_days} Days</p>
                    </div>
                    <div>
                      <p className="text-purple-300">Max Amount</p>
                      <p className="text-white font-semibold">₹{plan.max_amount?.toLocaleString() || 'No Limit'}</p>
                    </div>
                    <div>
                      <p className="text-purple-300">Total Return</p>
                      <p className="text-white font-semibold">{plan.total_return_percent}%</p>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Invest Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-white">Invest in {selectedPlan?.name}</DialogTitle>
                        <DialogDescription className="text-purple-300">
                          Enter the amount you want to invest
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount" className="text-white">Investment Amount (₹)</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder={`Min: ₹${selectedPlan?.min_amount?.toLocaleString()}`}
                            value={investAmount}
                            onChange={(e) => setInvestAmount(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        {selectedPlan && investAmount && (
                          <div className="bg-white/5 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-300">Daily ROI:</span>
                              <span className="text-white">₹{((parseFloat(investAmount) * selectedPlan.daily_roi) / 100).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-300">Total Return:</span>
                              <span className="text-white">₹{((parseFloat(investAmount) * selectedPlan.total_return_percent) / 100).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                        <Button 
                          onClick={handleInvest} 
                          disabled={investing || !investAmount}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          {investing ? 'Processing...' : 'Confirm Investment'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User's Investments */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="h-5 w-5 mr-2" />
                My Investments
              </CardTitle>
              <CardDescription className="text-purple-300">
                Track your active investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userInvestments.length === 0 ? (
                <p className="text-purple-300 text-center py-8">No investments found. Start investing to see them here.</p>
              ) : (
                <div className="space-y-4">
                  {userInvestments.map((investment) => {
                    const dailyAmount = (investment.amount * investment.daily_return) / 100;
                    const daysElapsed = Math.floor((new Date().getTime() - new Date(investment.started_at).getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={investment.id} className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold">{investment.plan_name}</h3>
                          <Badge className={`${investment.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                            {investment.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-purple-300">Amount</p>
                            <p className="text-white font-semibold">₹{investment.amount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-purple-300">Daily ROI</p>
                            <p className="text-white font-semibold">₹{dailyAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-purple-300">Progress</p>
                            <p className="text-white font-semibold">{daysElapsed} / {investment.duration_days} days</p>
                          </div>
                          <div>
                            <p className="text-purple-300">Total Return</p>
                            <p className="text-white font-semibold">₹{investment.total_return?.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Invest;
