import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, Target, DollarSign, ArrowLeft, Calendar, CheckCircle, Wallet, AlertCircle, Sparkles, Zap, Crown, Shield, Award, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import investmentBasic from '@/assets/investment-basic.jpg';
import investmentPremium from '@/assets/investment-premium.jpg';
import investmentElite from '@/assets/investment-elite.jpg';

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
  
  const [investing, setInvesting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Get plan image based on plan name
  const getPlanImage = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('elite') || name.includes('vip') || name.includes('platinum')) {
      return investmentElite;
    } else if (name.includes('premium') || name.includes('gold') || name.includes('silver')) {
      return investmentPremium;
    }
    return investmentBasic;
  };
  
  // Get plan icon based on plan name
  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('elite') || name.includes('vip') || name.includes('platinum')) {
      return Crown;
    } else if (name.includes('premium') || name.includes('gold') || name.includes('silver')) {
      return Award;
    }
    return Shield;
  };
  
  // Get plan color scheme
  const getPlanColors = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('elite') || name.includes('vip') || name.includes('platinum')) {
      return 'from-purple-600 via-pink-600 to-purple-600';
    } else if (name.includes('premium') || name.includes('gold') || name.includes('silver')) {
      return 'from-blue-600 via-cyan-600 to-blue-600';
    }
    return 'from-green-600 via-emerald-600 to-green-600';
  };

  useEffect(() => {
    if (user) {
      fetchData();
      
      // Set up realtime subscription for user's investments
      const channel = supabase
        .channel('user-investments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'roi_investments',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchData();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch investment plans
      const { data: plansData, error: plansError } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('status', 'active')
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

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .eq('currency', 'USDT')
        .single();

      if (walletError && walletError.code !== 'PGRST116') throw walletError;
      
      setWalletBalance(walletData?.balance || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load investment data",
        variant: "destructive",
      });
    }
  };

  const handleInvest = async () => {
    if (!selectedPlan || !investAmount || !user) return;

    const amount = parseFloat(investAmount);
    if (amount < selectedPlan.min_amount || (selectedPlan.max_amount && amount > selectedPlan.max_amount)) {
      toast({
        title: "Invalid Amount",
        description: `Investment amount must be between ${selectedPlan.min_amount.toLocaleString()} and ${selectedPlan.max_amount?.toLocaleString() || 'unlimited'} USDT`,
        variant: "destructive",
      });
      return;
    }

    // Check wallet balance
    if (amount > walletBalance) {
      toast({
        title: "Insufficient Balance",
        description: `Your wallet balance (${walletBalance.toFixed(2)} USDT) is insufficient for this investment`,
        variant: "destructive",
      });
      return;
    }

    setInvesting(true);
    try {
      const startDate = new Date();
      const expiresAt = new Date(Date.now() + selectedPlan.duration_days * 24 * 60 * 60 * 1000);

      // Start a transaction
      const { error: investError } = await supabase
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

      if (investError) throw investError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: walletBalance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'investment',
          amount,
          currency: 'USDT',
          category: 'investment',
          status: 'completed',
          notes: `Investment in ${selectedPlan.name} plan`,
          processed_at: new Date().toISOString()
        });

      if (txError) throw txError;

      toast({
        title: "Investment Successful!",
        description: `You have successfully invested ${amount.toLocaleString()} USDT in ${selectedPlan.name}`,
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {investmentPlans.map((plan, index) => {
              const Icon = getPlanIcon(plan.name);
              const gradientColors = getPlanColors(plan.name);
              const planImage = getPlanImage(plan.name);
              
              return (
                <div key={plan.id} className="group relative animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  {/* Glow effect */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradientColors} rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000`}></div>
                  
                  <Card className="relative bg-slate-900/90 border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                    {/* Image Section */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={planImage} 
                        alt={plan.name}
                        className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                      
                      {/* Plan Icon */}
                      <div className={`absolute top-4 right-4 p-3 bg-gradient-to-r ${gradientColors} rounded-xl shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      
                      {/* Plan Name & Badge */}
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                        <Badge className={`bg-gradient-to-r ${gradientColors} text-white border-0 px-3 py-1`}>
                          <Sparkles className="h-3 w-3 mr-1" />
                          {plan.daily_roi}% Daily ROI
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6 space-y-6">
                      {/* Description */}
                      <p className="text-purple-200 text-sm">
                        {plan.description || 'Experience premium returns with our carefully designed investment strategy'}
                      </p>
                      
                      {/* Investment Details */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            <span className="text-purple-300 text-sm">Min Investment</span>
                          </div>
                          <span className="text-white font-bold">{plan.min_amount?.toLocaleString()} USDT</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-blue-400" />
                            <span className="text-purple-300 text-sm">Max Investment</span>
                          </div>
                          <span className="text-white font-bold">{plan.max_amount?.toLocaleString() || 'Unlimited'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-purple-400" />
                            <span className="text-purple-300 text-sm">Duration</span>
                          </div>
                          <span className="text-white font-bold">{plan.duration_days} Days</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-yellow-400" />
                            <span className="text-purple-300 text-sm">Total Return</span>
                          </div>
                          <span className="text-green-400 font-bold text-lg">+{plan.total_return_percent}%</span>
                        </div>
                      </div>
                      
                      {/* Investment Features */}
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-purple-200">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          Daily automated payouts
                        </div>
                        <div className="flex items-center text-sm text-purple-200">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          Secure & guaranteed returns
                        </div>
                        <div className="flex items-center text-sm text-purple-200">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          24/7 investment monitoring
                        </div>
                      </div>
                      
                      {/* CTA Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className={`w-full bg-gradient-to-r ${gradientColors} hover:opacity-90 transition-all duration-300 group`}
                            onClick={() => setSelectedPlan(plan)}
                            size="lg"
                          >
                            <Zap className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                            Start Investing
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-white/10 max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-white flex items-center">
                              <Icon className="h-5 w-5 mr-2" />
                              Invest in {selectedPlan?.name}
                            </DialogTitle>
                            <DialogDescription className="text-purple-300">
                              Enter the amount you want to invest from your wallet
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-3 border border-white/10">
                              <div className="flex items-center justify-between">
                                <span className="text-purple-300 flex items-center">
                                  <Wallet className="h-4 w-4 mr-2" />
                                  Wallet Balance:
                                </span>
                                <span className="text-white font-semibold">{walletBalance.toFixed(2)} USDT</span>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="amount" className="text-white">Investment Amount (USDT)</Label>
                              <Input
                                id="amount"
                                type="number"
                                placeholder={`Min: ${selectedPlan?.min_amount?.toLocaleString()} USDT`}
                                value={investAmount}
                                onChange={(e) => setInvestAmount(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                              />
                            </div>
                            {selectedPlan && investAmount && (
                              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-purple-300">Daily ROI:</span>
                                  <span className="text-green-400 font-semibold">+{((parseFloat(investAmount) * selectedPlan.daily_roi) / 100).toFixed(2)} USDT</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-purple-300">Total Return:</span>
                                  <span className="text-green-400 font-semibold">+{((parseFloat(investAmount) * selectedPlan.total_return_percent) / 100).toFixed(2)} USDT</span>
                                </div>
                                {parseFloat(investAmount) > walletBalance && (
                                  <div className="flex items-center text-red-400 text-sm mt-2">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Insufficient wallet balance
                                  </div>
                                )}
                              </div>
                            )}
                            <Button 
                              onClick={handleInvest} 
                              disabled={investing || !investAmount || parseFloat(investAmount) > walletBalance}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            >
                              {investing ? 'Processing...' : 'Confirm Investment'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
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
                    const startDate = new Date(investment.started_at);
                    const now = new Date();
                    const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const progressPercent = Math.min((daysElapsed / investment.duration_days) * 100, 100);
                    const totalEarned = investment.total_paid_out || 0;
                    const expiresAt = new Date(investment.expires_at);
                    const isExpired = now > expiresAt;
                    
                    return (
                      <div key={investment.id} className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold">{investment.plan_name}</h3>
                          <Badge className={`${
                            investment.status === 'active' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : investment.status === 'completed'
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                              : 'bg-gradient-to-r from-gray-500 to-gray-600'
                          } text-white`}>
                            {investment.status === 'active' && !isExpired ? 'Active' : investment.status === 'completed' ? 'Completed' : 'Expired'}
                          </Badge>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-purple-300">Progress</span>
                            <span className="text-white">{daysElapsed} / {investment.duration_days} days</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-purple-300">Invested</p>
                            <p className="text-white font-semibold">{investment.amount?.toLocaleString()} USDT</p>
                          </div>
                          <div>
                            <p className="text-purple-300">Daily ROI</p>
                            <p className="text-green-400 font-semibold">+{dailyAmount.toFixed(2)} USDT</p>
                          </div>
                          <div>
                            <p className="text-purple-300">Total Earned</p>
                            <p className="text-green-400 font-semibold">+{totalEarned.toFixed(2)} USDT</p>
                          </div>
                          <div>
                            <p className="text-purple-300">Expected Return</p>
                            <p className="text-white font-semibold">{investment.total_return?.toFixed(2)} USDT</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center text-purple-300">
                              <Calendar className="h-3 w-3 mr-1" />
                              Started: {startDate.toLocaleDateString()}
                            </div>
                            {investment.last_payout_at && (
                              <div className="flex items-center text-green-400">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Last payout: {new Date(investment.last_payout_at).toLocaleDateString()}
                              </div>
                            )}
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
