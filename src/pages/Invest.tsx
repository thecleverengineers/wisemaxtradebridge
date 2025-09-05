
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, Clock, Target, DollarSign, ArrowLeft, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
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
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  daily_roi_amount: number;
  total_roi_expected: number;
  roi_credited_days: number;
  investment_plans: {
    name: string;
    daily_roi: number;
  };
}

interface WalletData {
  total_balance: number;
}

const Invest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
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
        .eq('is_active', true)
        .order('sort_order');

      if (plansError) throw plansError;
      setInvestmentPlans(plansData || []);

      // Fetch user's investments
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select(`
          *,
          investment_plans (name, daily_roi)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (investmentsError) throw investmentsError;
      setUserInvestments(investmentsData || []);

      // Fetch wallet balance
      const { data: walletResponse, error: walletError } = await supabase
        .from('wallets')
        .select('total_balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;
      setWalletData(walletResponse);

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
    const availableBalance = walletData?.total_balance || 0;

    // Validate amount range
    if (amount < selectedPlan.min_amount || (selectedPlan.max_amount && amount > selectedPlan.max_amount)) {
      toast({
        title: "Invalid Amount",
        description: `Investment amount must be between ₹${selectedPlan.min_amount.toLocaleString()} and ₹${selectedPlan.max_amount?.toLocaleString() || 'unlimited'}`,
        variant: "destructive",
      });
      return;
    }

    // Check wallet balance
    if (amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${amount.toLocaleString()} but only have ₹${availableBalance.toLocaleString()} in your wallet. Please add funds to continue.`,
        variant: "destructive",
      });
      return;
    }

    setInvesting(true);
    try {
      const dailyRoiAmount = (amount * selectedPlan.daily_roi) / 100;
      const totalRoiExpected = (amount * selectedPlan.total_return_percent) / 100;
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + selectedPlan.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Create investment
      const { error: investError } = await supabase
        .from('investments')
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          amount,
          daily_roi_amount: dailyRoiAmount,
          total_roi_expected: totalRoiExpected,
          start_date: startDate,
          end_date: endDate,
        });

      if (investError) throw investError;

      // Deduct amount from wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          total_balance: availableBalance - amount
        })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'debit',
          income_type: 'investment',
          amount: amount,
          balance_before: availableBalance,
          balance_after: availableBalance - amount,
          reason: `Investment in ${selectedPlan.name}`,
        });

      if (transactionError) throw transactionError;

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

          {/* Wallet Balance Card */}
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-6 w-6" />
                  <div>
                    <p className="text-green-100 text-sm">Available Balance</p>
                    <p className="text-2xl font-bold">₹{walletData?.total_balance?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/wallet')}
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  Add Funds
                </Button>
              </div>
            </CardContent>
          </Card>

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
                        {/* Wallet Balance Info */}
                        <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                          <span className="text-purple-300">Available Balance:</span>
                          <span className="text-white font-semibold">₹{walletData?.total_balance?.toLocaleString() || '0'}</span>
                        </div>

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

                        {/* Balance Check Warning */}
                        {investAmount && parseFloat(investAmount) > (walletData?.total_balance || 0) && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <span className="text-red-400 text-sm">
                              Insufficient balance. You need ₹{(parseFloat(investAmount) - (walletData?.total_balance || 0)).toLocaleString()} more.
                            </span>
                          </div>
                        )}

                        {selectedPlan && investAmount && parseFloat(investAmount) <= (walletData?.total_balance || 0) && (
                          <div className="bg-white/5 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-300">Daily ROI:</span>
                              <span className="text-white">₹{((parseFloat(investAmount) * selectedPlan.daily_roi) / 100).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-300">Total Return:</span>
                              <span className="text-white">₹{((parseFloat(investAmount) * selectedPlan.total_return_percent) / 100).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-300">Remaining Balance:</span>
                              <span className="text-white">₹{((walletData?.total_balance || 0) - parseFloat(investAmount)).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          onClick={handleInvest} 
                          disabled={investing || !investAmount || parseFloat(investAmount) > (walletData?.total_balance || 0)}
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
                  {userInvestments.map((investment) => (
                    <div key={investment.id} className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold">{investment.investment_plans?.name}</h3>
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
                          <p className="text-white font-semibold">₹{investment.daily_roi_amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-purple-300">Progress</p>
                          <p className="text-white font-semibold">{investment.roi_credited_days || 0} days</p>
                        </div>
                        <div>
                          <p className="text-purple-300">Expected Return</p>
                          <p className="text-white font-semibold">₹{investment.total_roi_expected?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
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
