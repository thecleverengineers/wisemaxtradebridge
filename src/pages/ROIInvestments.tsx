import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, Zap, Users, Leaf, Shield, Brain, 
  Clock, Trophy, Sparkles, DollarSign, Info,
  Star, Rocket, Target, Gift, Lock, Package, Gamepad2,
  RefreshCw, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ROIPlan {
  id: string;
  name: string;
  description: string | null;
  interest_rate: number;
  min_investment: number;
  max_investment: number | null;
  duration_value: number;
  duration_type: string;
  is_active: boolean | null;
  is_compounding: boolean | null;
  features: any;
  plan_type?: string | null;
  plan_category?: string | null;
  priority_order?: number | null;
  max_users?: number | null;
  current_users?: number | null;
  activation_rules?: any;
  bonus_structure?: any;
}

interface UserInvestment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  current_value: number;
  maturity_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_calculation_date: string;
  total_withdrawn: number;
  auto_reinvest: boolean;
  roi_plans?: ROIPlan;
}

const categoryIcons: Record<string, any> = {
  crypto: TrendingUp,
  gaming: Trophy,
  social: Users,
  esg: Leaf,
  security: Shield,
  innovation: Brain,
  limited: Clock,
  defi: Rocket,
  market: Target,
  event: Gift,
  standard: DollarSign
};

const categoryColors: Record<string, string> = {
  crypto: 'bg-gradient-to-r from-orange-500 to-yellow-500',
  gaming: 'bg-gradient-to-r from-purple-500 to-pink-500',
  social: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  esg: 'bg-gradient-to-r from-green-500 to-emerald-500',
  security: 'bg-gradient-to-r from-gray-600 to-gray-800',
  innovation: 'bg-gradient-to-r from-indigo-500 to-purple-500',
  limited: 'bg-gradient-to-r from-red-500 to-orange-500',
  defi: 'bg-gradient-to-r from-violet-500 to-purple-500',
  market: 'bg-gradient-to-r from-teal-500 to-green-500',
  event: 'bg-gradient-to-r from-pink-500 to-rose-500',
  standard: 'bg-gradient-to-r from-slate-500 to-slate-700'
};

export default function ROIInvestments() {
  const [plans, setPlans] = useState<ROIPlan[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<ROIPlan | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    fetchPlans();
    fetchUserInvestments();

    // Set up real-time subscriptions
    const channel = setupRealtimeSubscriptions();

    return () => {
      channel?.unsubscribe();
    };
  }, [user]);

  const fetchUserInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roi_investments')
        .select(`
          *,
          roi_plans (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUserInvestments(data || []);
      
      // Calculate totals
      if (data) {
        const invested = data.reduce((sum, inv) => sum + inv.amount, 0);
        const earnings = data.reduce((sum, inv) => sum + (inv.current_value - inv.amount), 0);
        setTotalInvested(invested);
        setTotalEarnings(earnings);
      }
    } catch (error: any) {
      console.error('Error fetching user investments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your investments',
        variant: 'destructive'
      });
    }
  };

  const setupRealtimeSubscriptions = (): RealtimeChannel | null => {
    if (!user) return null;

    const channel = supabase.channel('roi-investments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roi_investments',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Investment update:', payload);
          
          if (payload.eventType === 'INSERT') {
            fetchUserInvestments();
          } else if (payload.eventType === 'UPDATE') {
            setUserInvestments(prev => prev.map(inv => 
              inv.id === payload.new.id ? { ...inv, ...payload.new } : inv
            ));
            
            // Recalculate totals
            const updated = userInvestments.map(inv => 
              inv.id === payload.new.id ? { ...inv, ...payload.new } : inv
            );
            const invested = updated.reduce((sum, inv) => sum + inv.amount, 0);
            const earnings = updated.reduce((sum, inv) => sum + (inv.current_value - inv.amount), 0);
            setTotalInvested(invested);
            setTotalEarnings(earnings);
          } else if (payload.eventType === 'DELETE') {
            setUserInvestments(prev => prev.filter(inv => inv.id !== payload.old.id));
            fetchUserInvestments();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roi_plans'
        },
        (payload) => {
          console.log('Plan update:', payload);
          fetchPlans();
        }
      )
      .subscribe();

    return channel;
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchPlans(), fetchUserInvestments()]);
      toast({
        title: 'Data Refreshed',
        description: 'All investment data has been updated',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('roi_plans')
        .select('*')
        .eq('is_active', true)
        .order('priority_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleInvest = async (plan: ROIPlan) => {
    if (!investmentAmount || parseFloat(investmentAmount) < plan.min_investment) {
      toast({
        title: 'Invalid Amount',
        description: `Minimum investment is $${plan.min_investment}`,
        variant: 'destructive'
      });
      return;
    }

    if (plan.max_investment && parseFloat(investmentAmount) > plan.max_investment) {
      toast({
        title: 'Invalid Amount',
        description: `Maximum investment is $${plan.max_investment}`,
        variant: 'destructive'
      });
      return;
    }

    try {
      // Calculate maturity date based on duration
      const maturityDate = new Date();
      if (plan.duration_type === 'hourly') {
        maturityDate.setHours(maturityDate.getHours() + plan.duration_value);
      } else if (plan.duration_type === 'daily') {
        maturityDate.setDate(maturityDate.getDate() + plan.duration_value);
      } else if (plan.duration_type === 'monthly') {
        maturityDate.setMonth(maturityDate.getMonth() + plan.duration_value);
      } else if (plan.duration_type === 'yearly') {
        maturityDate.setFullYear(maturityDate.getFullYear() + plan.duration_value);
      }

      const { error } = await supabase
        .from('user_roi_investments')
        .insert({
          user_id: user?.id,
          plan_id: plan.id,
          amount: parseFloat(investmentAmount),
          current_value: parseFloat(investmentAmount),
          maturity_date: maturityDate.toISOString(),
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Investment Successful!',
        description: `You've invested $${investmentAmount} in ${plan.name}`,
      });

      setInvestmentAmount('');
      setSelectedPlan(null);
    } catch (error: any) {
      toast({
        title: 'Investment Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredPlans = selectedCategory === 'all' 
    ? plans 
    : plans.filter(plan => plan.plan_category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(plans.map(p => p.plan_category).filter(Boolean)))];

  const getPlanBadge = (plan: ROIPlan) => {
    if (plan.plan_type === 'flash') return <Badge className="bg-red-500">Flash Deal</Badge>;
    if (plan.plan_type === 'gamified') return <Badge className="bg-purple-500">Gamified</Badge>;
    if (plan.plan_type === 'dynamic') return <Badge className="bg-blue-500">Dynamic</Badge>;
    if (plan.plan_type === 'social') return <Badge className="bg-cyan-500">Social</Badge>;
    if (plan.max_users && plan.current_users) {
      const slotsLeft = plan.max_users - plan.current_users;
      if (slotsLeft < 10) return <Badge className="bg-orange-500">{slotsLeft} slots left</Badge>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader onMenuClick={() => setIsSidebarOpen(true)} />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Revolutionary Investment Plans
            </h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={refreshData}
              disabled={isRefreshing}
              className={isRefreshing ? 'animate-spin' : ''}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Discover innovative ways to grow your wealth
          </p>
        </div>

        {/* Real-time Investment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Total Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalInvested.toFixed(2)}</p>
              <p className="text-xs opacity-80">Across {userInvestments.length} plans</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {totalEarnings >= 0 ? '+' : ''}{`$${totalEarnings.toFixed(2)}`}
              </p>
              <p className="text-xs opacity-80 flex items-center gap-1">
                {totalEarnings >= 0 ? 
                  <ArrowUpRight className="h-3 w-3" /> : 
                  <ArrowDownRight className="h-3 w-3" />
                }
                {totalInvested > 0 ? 
                  `${((totalEarnings / totalInvested) * 100).toFixed(2)}% ROI` : 
                  '0% ROI'
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {userInvestments.filter(inv => inv.status === 'active').length}
              </p>
              <p className="text-xs opacity-80">Currently earning</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${userInvestments.reduce((sum, inv) => sum + inv.current_value, 0).toFixed(2)}
              </p>
              <p className="text-xs opacity-80">Current total value</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Investments Section */}
        {userInvestments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Your Active Investments
                <Badge variant="secondary">{userInvestments.length}</Badge>
              </CardTitle>
              <CardDescription>Real-time tracking of your investment portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {userInvestments.map((investment) => (
                  <div key={investment.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{investment.roi_plans?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Invested: ${investment.amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          ${investment.current_value.toFixed(2)}
                        </p>
                        <p className={`text-sm ${investment.current_value > investment.amount ? 'text-green-500' : 'text-red-500'}`}>
                          {investment.current_value > investment.amount ? '+' : ''}
                          ${(investment.current_value - investment.amount).toFixed(2)}
                          ({((investment.current_value - investment.amount) / investment.amount * 100).toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                        {investment.status}
                      </Badge>
                      <span className="text-muted-foreground">
                        Matures: {new Date(investment.maturity_date).toLocaleDateString()}
                      </span>
                    </div>
                    <Progress 
                      value={
                        ((new Date().getTime() - new Date(investment.created_at).getTime()) /
                        (new Date(investment.maturity_date).getTime() - new Date(investment.created_at).getTime())) * 100
                      } 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-6 gap-2 h-auto p-1">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">All</span>
            </TabsTrigger>
            {categories.filter(c => c !== 'all').map(category => {
              const Icon = categoryIcons[category] || DollarSign;
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex items-center gap-1 capitalize"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => {
                const Icon = categoryIcons[plan.plan_category] || DollarSign;
                const isLimited = plan.max_users && plan.current_users && 
                  (plan.max_users - plan.current_users) < plan.max_users * 0.2;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 ${
                      isLimited ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
                    }`}
                  >
                    <div className={`h-2 ${categoryColors[plan.plan_category]}`} />
                    
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${categoryColors[plan.plan_category]} bg-opacity-10`}>
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                        </div>
                        {getPlanBadge(plan)}
                      </div>
                      
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Returns</p>
                          <p className="text-2xl font-bold text-primary">
                            {plan.interest_rate}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {plan.duration_type}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="text-2xl font-bold">
                            {plan.duration_value}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {plan.duration_type}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Min</span>
                          <span className="font-semibold">${plan.min_investment}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Max</span>
                          <span className="font-semibold">${plan.max_investment?.toLocaleString() || 'Unlimited'}</span>
                        </div>
                      </div>

                      {plan.max_users && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Availability</span>
                            <span className="font-semibold">
                              {plan.current_users || 0}/{plan.max_users}
                            </span>
                          </div>
                          <Progress 
                            value={(plan.current_users || 0) / plan.max_users * 100} 
                            className="h-2"
                          />
                        </div>
                      )}

                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-muted-foreground">Features</p>
                          <div className="flex flex-wrap gap-1">
                            {plan.features.slice(0, 3).map((feature, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          className="flex-1"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Invest Now
                        </Button>
                        <Button variant="outline" size="icon">
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>

                      {plan.is_compounding && (
                        <Badge className="w-full justify-center" variant="outline">
                          <Star className="w-3 h-3 mr-1" />
                          Auto-Compounding
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Investment Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Invest in {selectedPlan.name}</CardTitle>
                <CardDescription>
                  Enter the amount you want to invest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Investment Amount ($)</label>
                  <input
                    type="number"
                    className="w-full p-2 mt-1 border rounded-lg"
                    placeholder={`Min: $${selectedPlan.min_investment}`}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    min={selectedPlan.min_investment}
                    max={selectedPlan.max_investment}
                  />
                </div>
                
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Expected Returns:</span>
                    <span className="font-bold text-primary">
                      {selectedPlan.interest_rate}% {selectedPlan.duration_type}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duration:</span>
                    <span className="font-bold">
                      {selectedPlan.duration_value} {selectedPlan.duration_type}
                    </span>
                  </div>
                  {investmentAmount && (
                    <div className="flex justify-between text-sm">
                      <span>Potential Earnings:</span>
                      <span className="font-bold text-green-500">
                        ${(parseFloat(investmentAmount) * selectedPlan.interest_rate / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleInvest(selectedPlan)}
                    disabled={!investmentAmount}
                  >
                    Confirm Investment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPlan(null);
                      setInvestmentAmount('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <BottomNavigation />
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}