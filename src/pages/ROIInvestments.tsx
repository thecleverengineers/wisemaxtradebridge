import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  TrendingUp, Zap, Users, Leaf, Shield, Brain, 
  Clock, Trophy, Sparkles, DollarSign, Info,
  Star, Rocket, Target, Gift, Lock, Package,
  RefreshCw, Activity, ArrowUpRight, ArrowDownRight,
  Calculator, Wallet, CheckCircle2, XCircle,
  AlertCircle, Timer, Award, ChartBar,
  Percent, Calendar, CreditCard, History,
  ArrowRight, Gem, Crown, Diamond, PiggyBank,
  Search
} from 'lucide-react';

interface InvestmentPlan {
  id: string;
  name: string;
  description: string | null;
  daily_roi: number;
  min_amount: number;
  max_amount: number;
  duration_days: number;
  total_return_percent: number;
  status: string;
  created_at: string;
}

interface UserInvestment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_roi_earned: number;
  last_payout_date: string | null;
  investment_plans?: InvestmentPlan;
}

interface WalletData {
  balance: number;
  roi_income: number;
  locked_balance: number;
}

const planIcons: Record<string, any> = {
  'Basic': Package,
  'Silver': Star,
  'Gold': Crown,
  'Platinum': Diamond,
  'Premium': Gem,
  'Elite': Rocket,
  'Standard': DollarSign,
  'Advanced': TrendingUp,
  'Professional': Trophy,
  'Enterprise': Shield
};

const planGradients: Record<string, string> = {
  'Basic': 'from-gray-500 to-gray-600',
  'Silver': 'from-gray-400 to-gray-500',
  'Gold': 'from-yellow-500 to-amber-600',
  'Platinum': 'from-purple-500 to-indigo-600',
  'Premium': 'from-pink-500 to-rose-600',
  'Elite': 'from-red-500 to-orange-600',
  'Standard': 'from-blue-500 to-cyan-600',
  'Advanced': 'from-green-500 to-emerald-600',
  'Professional': 'from-indigo-500 to-purple-600',
  'Enterprise': 'from-slate-700 to-slate-900'
};

export default function ROIInvestments() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [walletData, setWalletData] = useState<WalletData>({ balance: 0, roi_income: 0, locked_balance: 0 });
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [autoReinvest, setAutoReinvest] = useState(false);
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  // Statistics
  const [stats, setStats] = useState({
    totalInvested: 0,
    totalReturns: 0,
    activeInvestments: 0,
    completedInvestments: 0,
    todayEarnings: 0,
    pendingReturns: 0,
    averageROI: 0
  });

  useEffect(() => {
    // Always fetch investment plans - no authentication required
    console.log('Fetching investment plans (public access)...');
    fetchPlans();
    
    // Only fetch user-specific data if authenticated
    if (user?.id) {
      console.log('User authenticated, fetching user data for:', user.id);
      fetchUserInvestments();
      fetchWalletData();
      setupRealtimeSubscriptions();
    }
  }, [user?.id]);

  const fetchData = async () => {
    console.log('Starting fetchData...');
    await Promise.all([
      fetchPlans(),
      fetchUserInvestments(),
      fetchWalletData()
    ]);
  };

  const fetchPlans = async () => {
    try {
      console.log('Fetching ROI plans...');
      const { data, error } = await supabase
        .from('roi_plans')
        .select('*')
        .eq('is_active', true)
        .order('priority_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching ROI plans:', error);
        throw error;
      }
      
      console.log('Fetched ROI plans:', data);
      
      // Map roi_plans to match the expected interface
      const mappedPlans = (data || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        daily_roi: plan.interest_rate, // Using interest_rate as daily ROI
        min_amount: plan.min_investment,
        max_amount: plan.max_investment || 1000000,
        duration_days: plan.duration_value,
        total_return_percent: plan.interest_rate * plan.duration_value, // Calculate total return
        status: plan.is_active ? 'active' : 'inactive',
        created_at: plan.created_at,
        // Additional properties from roi_plans
        plan_type: plan.plan_type,
        plan_category: plan.plan_category,
        is_compounding: plan.is_compounding,
        features: plan.features || [],
        duration_type: plan.duration_type
      }));
      
      console.log('Mapped plans:', mappedPlans);
      setPlans(mappedPlans);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error in fetchPlans:', error);
      toast({
        title: 'Error',
        description: `Failed to load investment plans: ${error.message}`,
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const fetchUserInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          investment_plans (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUserInvestments(data || []);
      calculateStatistics(data || []);
    } catch (error: any) {
      console.error('Error fetching investments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your investments',
        variant: 'destructive'
      });
    }
  };

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance, roi_income, locked_balance')
        .eq('user_id', user?.id)
        .eq('currency', 'USDT')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setWalletData(data);
      }
    } catch (error: any) {
      console.error('Error fetching wallet:', error);
    }
  };

  const calculateStatistics = (investments: UserInvestment[]) => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalReturns = investments.reduce((sum, inv) => sum + (inv.total_roi_earned || 0), 0);
    const activeInvestments = investments.filter(inv => inv.status === 'active').length;
    const completedInvestments = investments.filter(inv => inv.status === 'completed').length;
    
    // Calculate today's earnings
    const today = new Date().toDateString();
    const todayEarnings = investments
      .filter(inv => inv.last_payout_date && new Date(inv.last_payout_date).toDateString() === today)
      .reduce((sum, inv) => {
        const dailyROI = inv.investment_plans?.daily_roi || 0;
        return sum + (inv.amount * dailyROI / 100);
      }, 0);
    
    // Calculate pending returns
    const pendingReturns = investments
      .filter(inv => inv.status === 'active')
      .reduce((sum, inv) => {
        const expectedReturn = inv.amount * ((inv.investment_plans?.total_return_percent || 0) / 100);
        const earnedSoFar = inv.total_roi_earned || 0;
        return sum + (expectedReturn - earnedSoFar);
      }, 0);
    
    const averageROI = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
    
    setStats({
      totalInvested,
      totalReturns,
      activeInvestments,
      completedInvestments,
      todayEarnings,
      pendingReturns,
      averageROI
    });
  };

  const setupRealtimeSubscriptions = () => {
    const investmentChannel = supabase
      .channel('investment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchUserInvestments();
        }
      )
      .subscribe();

    const walletChannel = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchWalletData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(investmentChannel);
      supabase.removeChannel(walletChannel);
    };
  };

  const handleInvest = async () => {
    if (!selectedPlan || !investmentAmount) return;

    const amount = parseFloat(investmentAmount);
    
    // Validation
    if (amount < selectedPlan.min_amount) {
      toast({
        title: 'Invalid Amount',
        description: `Minimum investment is $${selectedPlan.min_amount}`,
        variant: 'destructive'
      });
      return;
    }

    if (amount > selectedPlan.max_amount) {
      toast({
        title: 'Invalid Amount',
        description: `Maximum investment is $${selectedPlan.max_amount}`,
        variant: 'destructive'
      });
      return;
    }

    if (amount > walletData.balance) {
      toast({
        title: 'Insufficient Balance',
        description: 'Please add funds to your wallet first',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

      // Create investment
      const { data: investment, error: investError } = await supabase
        .from('investments')
        .insert({
          user_id: user?.id,
          plan_id: selectedPlan.id,
          amount: amount,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active',
          total_roi_earned: 0
        })
        .select()
        .single();

      if (investError) throw investError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: walletData.balance - amount,
          locked_balance: walletData.locked_balance + amount
        })
        .eq('user_id', user?.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'investment',
          category: 'investment',
          currency: 'USDT',
          amount: amount,
          status: 'completed',
          reference_id: investment.id,
          notes: `Investment in ${selectedPlan.name} plan`
        });

      if (txError) throw txError;

      toast({
        title: 'Investment Successful!',
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Invested ${amount} in {selectedPlan.name}</span>
          </div>
        ),
      });

      setShowInvestDialog(false);
      setInvestmentAmount('');
      setSelectedPlan(null);
      fetchData();
    } catch (error: any) {
      console.error('Investment error:', error);
      toast({
        title: 'Investment Failed',
        description: error.message || 'Failed to process investment',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openInvestDialog = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setShowInvestDialog(true);
    setInvestmentAmount('');
  };

  const calculateExpectedReturns = () => {
    if (!selectedPlan || !investmentAmount) return { daily: 0, total: 0 };
    
    const amount = parseFloat(investmentAmount) || 0;
    const daily = amount * (selectedPlan.daily_roi / 100);
    const total = amount * (selectedPlan.total_return_percent / 100);
    
    return { daily, total };
  };

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanIcon = (planName: string) => {
    const key = Object.keys(planIcons).find(k => planName.includes(k));
    return key ? planIcons[key] : DollarSign;
  };

  const getPlanGradient = (planName: string) => {
    const key = Object.keys(planGradients).find(k => planName.includes(k));
    return key ? planGradients[key] : 'from-blue-500 to-purple-600';
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <AppHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="container mx-auto px-4 py-6 pt-20 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Investment Plans
          </h1>
          <p className="text-purple-300">
            Choose from our premium investment plans and grow your wealth
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm">Total Invested</p>
                  <p className="text-2xl font-bold text-white">
                    ${stats.totalInvested.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-300 mt-1">
                    {stats.activeInvestments} active plans
                  </p>
                </div>
                <PiggyBank className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm">Total Returns</p>
                  <p className="text-2xl font-bold text-white">
                    ${stats.totalReturns.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-300 mt-1 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {stats.averageROI.toFixed(2)}% ROI
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm">Today's Earnings</p>
                  <p className="text-2xl font-bold text-white">
                    ${stats.todayEarnings.toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-300 mt-1">
                    Daily income
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm">Wallet Balance</p>
                  <p className="text-2xl font-bold text-white">
                    ${walletData.balance.toFixed(2)}
                  </p>
                  <p className="text-xs text-yellow-300 mt-1">
                    Available funds
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="plans">Investment Plans</TabsTrigger>
            <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
            <TabsTrigger value="history">ROI History</TabsTrigger>
          </TabsList>

          {/* Investment Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                <Input
                  placeholder="Search plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button
                onClick={fetchData}
                variant="outline"
                className="border-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => {
                const Icon = getPlanIcon(plan.name);
                const gradient = getPlanGradient(plan.name);
                const isInvested = userInvestments.some(inv => 
                  inv.plan_id === plan.id && inv.status === 'active'
                );
                
                return (
                  <Card 
                    key={plan.id} 
                    className="bg-white/5 border-white/10 hover:bg-white/10 transition-all hover:scale-105"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        {isInvested && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-white mt-3">{plan.name}</CardTitle>
                      <CardDescription className="text-purple-300">
                        {plan.description || 'Premium investment opportunity'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-300 text-sm flex items-center">
                            <Percent className="h-4 w-4 mr-2" />
                            Daily ROI
                          </span>
                          <span className="text-white font-semibold">
                            {plan.daily_roi}%
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-purple-300 text-sm flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Duration
                          </span>
                          <span className="text-white font-semibold">
                            {plan.duration_days} days
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-purple-300 text-sm flex items-center">
                            <Target className="h-4 w-4 mr-2" />
                            Total Return
                          </span>
                          <span className="text-green-400 font-semibold">
                            {plan.total_return_percent}%
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-purple-300 text-sm flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Investment Range
                          </span>
                          <span className="text-white text-sm">
                            ${plan.min_amount} - ${plan.max_amount}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-white/10">
                        {user ? (
                          <Button
                            onClick={() => openInvestDialog(plan)}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            disabled={walletData.balance < plan.min_amount}
                          >
                            {walletData.balance < plan.min_amount ? (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Insufficient Balance
                              </>
                            ) : (
                              <>
                                <Rocket className="h-4 w-4 mr-2" />
                                Invest Now
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => window.location.href = '/auth'}
                            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Login to Invest
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            {!user ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <Lock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Login Required</h3>
                  <p className="text-purple-300 mb-4">Please login to view your investment portfolio</p>
                  <Button
                    onClick={() => window.location.href = '/auth'}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Login Now
                  </Button>
                </CardContent>
              </Card>
            ) : userInvestments.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <Activity className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Active Investments</h3>
                  <p className="text-purple-300 mb-4">Start your investment journey today</p>
                  <Button
                    onClick={() => setActiveTab('plans')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Browse Plans
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {userInvestments.map((investment) => {
                    const progress = investment.status === 'active' 
                      ? ((new Date().getTime() - new Date(investment.start_date).getTime()) /
                         (new Date(investment.end_date).getTime() - new Date(investment.start_date).getTime())) * 100
                      : 100;
                    
                    return (
                      <Card key={investment.id} className="bg-white/5 border-white/10">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-white font-semibold text-lg">
                                {investment.investment_plans?.name}
                              </h3>
                              <div className="flex items-center gap-4 mt-1">
                                <Badge className={`${
                                  investment.status === 'active' 
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                }`}>
                                  {investment.status}
                                </Badge>
                                <span className="text-purple-300 text-sm">
                                  Started {formatDistanceToNow(new Date(investment.start_date), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">
                                ${investment.amount.toFixed(2)}
                              </p>
                              <p className="text-sm text-purple-300">Invested</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-purple-300 text-xs">Daily ROI</p>
                              <p className="text-white font-semibold">
                                ${(investment.amount * (investment.investment_plans?.daily_roi || 0) / 100).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-purple-300 text-xs">Earned</p>
                              <p className="text-green-400 font-semibold">
                                ${investment.total_roi_earned.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-purple-300 text-xs">Expected</p>
                              <p className="text-white font-semibold">
                                ${(investment.amount * ((investment.investment_plans?.total_return_percent || 0) / 100)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-300">Progress</span>
                              <span className="text-purple-300">{Math.min(progress, 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={Math.min(progress, 100)} className="h-2" />
                            <div className="flex justify-between text-xs text-purple-300">
                              <span>{new Date(investment.start_date).toLocaleDateString()}</span>
                              <span>{new Date(investment.end_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {investment.last_payout_date && (
                            <Alert className="mt-4 bg-green-500/10 border-green-500/30">
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                              <AlertDescription className="text-green-400">
                                Last payout: {formatDistanceToNow(new Date(investment.last_payout_date), { addSuffix: true })}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-purple-400" />
                  Investment History
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Track all your investment activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {!user ? (
                    <div className="text-center py-8">
                      <Lock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-300">Login to view your investment history</p>
                      <Button
                        onClick={() => window.location.href = '/auth'}
                        className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        Login Now
                      </Button>
                    </div>
                  ) : userInvestments.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-300">No investment history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userInvestments.map((investment) => (
                        <div 
                          key={investment.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              investment.status === 'active'
                                ? 'bg-green-500/20'
                                : 'bg-blue-500/20'
                            }`}>
                              {investment.status === 'active' ? (
                                <Activity className="h-4 w-4 text-green-400" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {investment.investment_plans?.name}
                              </p>
                              <p className="text-purple-300 text-sm">
                                {formatDistanceToNow(new Date(investment.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">
                              ${investment.amount.toFixed(2)}
                            </p>
                            <p className={`text-sm ${
                              investment.total_roi_earned > 0 
                                ? 'text-green-400' 
                                : 'text-purple-300'
                            }`}>
                              +${investment.total_roi_earned.toFixed(2)} earned
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Investment Dialog */}
        <Dialog open={showInvestDialog} onOpenChange={setShowInvestDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Invest in {selectedPlan?.name}</DialogTitle>
              <DialogDescription className="text-purple-300">
                Enter the amount you want to invest
              </DialogDescription>
            </DialogHeader>
            
            {selectedPlan && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Daily ROI:</span>
                    <span className="text-white font-semibold">{selectedPlan.daily_roi}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Duration:</span>
                    <span className="text-white font-semibold">{selectedPlan.duration_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Total Return:</span>
                    <span className="text-green-400 font-semibold">{selectedPlan.total_return_percent}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-purple-300">Investment Amount (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                      min={selectedPlan.min_amount}
                      max={selectedPlan.max_amount}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">Min: ${selectedPlan.min_amount}</span>
                    <span className="text-purple-300">Max: ${selectedPlan.max_amount}</span>
                  </div>
                </div>
                
                {investmentAmount && (
                  <Alert className="bg-purple-500/10 border-purple-500/30">
                    <Calculator className="h-4 w-4 text-purple-400" />
                    <AlertDescription className="text-purple-300">
                      <div className="space-y-1">
                        <p>Daily Returns: ${calculateExpectedReturns().daily.toFixed(2)}</p>
                        <p>Total Returns: ${calculateExpectedReturns().total.toFixed(2)}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <Label htmlFor="auto-reinvest" className="text-purple-300 cursor-pointer">
                    Auto-reinvest earnings
                  </Label>
                  <Switch
                    id="auto-reinvest"
                    checked={autoReinvest}
                    onCheckedChange={setAutoReinvest}
                  />
                </div>
                
                <Alert className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-300">
                    Available balance: ${walletData.balance.toFixed(2)}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInvestDialog(false)}
                className="border-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvest}
                disabled={isLoading || !investmentAmount || parseFloat(investmentAmount) < (selectedPlan?.min_amount || 0)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Investment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <BottomNavigation />
    </div>
  );
}