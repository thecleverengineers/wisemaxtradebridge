import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  DollarSign, 
  Lock, 
  Unlock, 
  Calendar, 
  Percent,
  Clock,
  Shield,
  Gift,
  RefreshCw,
  Info,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import type { Database } from '@/integrations/supabase/types';

type StakingPlan = Database['public']['Tables']['staking_plans']['Row'];
type StakingRecord = Database['public']['Tables']['staking_records']['Row'] & {
  staking_plans?: StakingPlan;
};

const USDTStaking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [isStakeDialogOpen, setIsStakeDialogOpen] = useState(false);
  const [selectedPlanForStaking, setSelectedPlanForStaking] = useState<StakingPlan | null>(null);
  const [stakingType, setStakingType] = useState<'flexible' | 'locked'>('flexible');
  const [selectedDuration, setSelectedDuration] = useState('30');
  const [stakeAmount, setStakeAmount] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const [plans, setPlans] = useState<StakingPlan[]>([]);
  const [positions, setPositions] = useState<StakingRecord[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalStaked: 0,
    totalEarned: 0,
    dailyEarnings: 0
  });

  useEffect(() => {
    if (user) {
      fetchData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to staking positions changes
    const positionsChannel = supabase
      .channel('staking-positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staking_positions',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchPositions();
          calculateStats();
        }
      )
      .subscribe();

    // Subscribe to earnings changes
    const earningsChannel = supabase
      .channel('staking-earnings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staking_earnings',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchEarnings();
          calculateStats();
        }
      )
      .subscribe();

    // Subscribe to wallet changes
    const walletChannel = supabase
      .channel('wallet-balance-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchWalletBalance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(positionsChannel);
      supabase.removeChannel(earningsChannel);
      supabase.removeChannel(walletChannel);
    };
  };

  const fetchData = async () => {
    await Promise.all([
      fetchPlans(),
      fetchPositions(),
      fetchEarnings(),
      fetchWalletBalance()
    ]);
    calculateStats();
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('staking_plans')
        .select('*')
        .eq('status', 'active')
        .order('duration_days', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching staking plans:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('staking_records')
        .select(`
          *,
          staking_plans(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      // Mock earnings since staking_earnings table doesn't exist
      setEarnings([]);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .eq('currency', 'USDT')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setWalletBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const calculateStats = () => {
    const activePositions = positions.filter(p => p.status === 'active');
    
    const totalStaked = activePositions.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalEarned = positions.reduce((sum, p) => sum + (p.total_earned || 0), 0);
    const dailyEarnings = activePositions.reduce((sum, p) => {
      return sum + (p.daily_return_amount || 0);
    }, 0);

    setTotalStats({
      totalStaked,
      totalEarned,
      dailyEarnings
    });
  };

  const calculateDailyEarnings = (amount: number, apy: number) => {
    return (amount * (apy / 100)) / 365;
  };

  const calculateEstimatedEarnings = (amount: number, apy: number, days: number) => {
    const dailyRate = apy / 365 / 100;
    return amount * dailyRate * days;
  };

  const getCurrentPlan = () => {
    // Just return first plan since staking_plans doesn't have type field
    return plans[0];
  };

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    const currentPlan = getCurrentPlan();
    
    if (!currentPlan) {
      toast({
        title: "Error",
        description: "Please select a valid staking plan",
        variant: "destructive",
      });
      return;
    }

    if (!amount || amount < currentPlan.min_amount) {
      toast({
        title: "Invalid Amount",
        description: `Minimum stake amount is ${currentPlan.min_amount} USDT`,
        variant: "destructive",
      });
      return;
    }

    if (amount > walletBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough USDT in your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      const endDate = new Date(Date.now() + currentPlan.duration_days * 24 * 60 * 60 * 1000).toISOString();

      const { error: recordError } = await supabase
        .from('staking_records')
        .insert([{
          user_id: user?.id,
          plan_id: currentPlan.id,
          amount,
          end_date: endDate,
          status: 'active'
        }]);

      if (recordError) throw recordError;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: walletBalance - amount,
          locked_balance: (walletBalance - amount) 
        })
        .eq('user_id', user?.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user?.id,
          type: 'stake',
          amount: amount,
          balance_after: walletBalance - amount,
          reason: `Staked in ${currentPlan.name}`
        }]);

      if (txError) throw txError;

      toast({
        title: "Staking Successful",
        description: `Successfully staked ${amount} USDT in ${currentPlan.name}`,
      });
      
      handleStakeSuccess();
      fetchData();
    } catch (error) {
      console.error('Error staking:', error);
      toast({
        title: "Staking Failed",
        description: "Failed to stake USDT. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWithdraw = async (position: StakingRecord) => {
    const isEarlyWithdrawal = position.end_date && new Date(position.end_date) > new Date();
    if (isEarlyWithdrawal) {
      const confirmed = window.confirm(
        "Early withdrawal will forfeit all earned interest. Are you sure you want to proceed?"
      );
      if (!confirmed) return;
    }

    try {
      const returnAmount = !isEarlyWithdrawal
        ? position.amount + (position.total_earned || 0)
        : position.amount;
      
      const { error: recordError } = await supabase
        .from('staking_records')
        .update({ 
          status: 'completed'
        })
        .eq('id', position.id);

      if (recordError) throw recordError;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: walletBalance + returnAmount,
          locked_balance: Math.max(0, walletBalance - returnAmount)
        })
        .eq('user_id', user?.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user?.id,
          type: 'withdraw',
          amount: returnAmount,
          balance_after: walletBalance + returnAmount,
          reason: `Withdrawn from staking${isEarlyWithdrawal ? ' (Early withdrawal - forfeited interest)' : ''}`
        }]);

      if (txError) throw txError;

      toast({
        title: "Withdrawal Successful",
        description: `Successfully withdrawn ${returnAmount.toFixed(2)} USDT${isEarlyWithdrawal ? ' (Early withdrawal - interest forfeited)' : ''}`,
      });
      
      fetchData();
    } catch (error) {
      console.error('Error withdrawing:', error);
      toast({
        title: "Withdrawal Failed",
        description: "Failed to withdraw. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRemainingDays = (endDate: string) => {
    const remaining = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  const handleOpenStakeDialog = (plan?: StakingPlan) => {
    if (plan) {
      setSelectedPlanForStaking(plan);
      setStakingType('flexible');
      setSelectedDuration(plan.duration_days.toString());
    }
    setIsStakeDialogOpen(true);
  };

  const handleStakeSuccess = () => {
    setIsStakeDialogOpen(false);
    setStakeAmount('');
    setAutoRenew(false);
    setSelectedPlanForStaking(null);
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">USDT Staking</h1>
              <p className="text-base md:text-lg text-muted-foreground">Earn passive income with stable returns</p>
            </div>
            <Button 
              onClick={() => handleOpenStakeDialog()}
              size="lg"
              className="hidden md:flex"
            >
              <Lock className="h-5 w-5 mr-2" />
              Stake Now
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold text-foreground">₹{walletBalance.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Staked</p>
                    <p className="text-2xl font-bold text-foreground">
                      ₹{totalStats.totalStaked.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-bold text-foreground">
                      ₹{totalStats.totalEarned.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Daily Earnings</p>
                    <p className="text-2xl font-bold text-foreground">
                      ₹{totalStats.dailyEarnings.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staking Plans */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Percent className="h-6 w-6 text-primary" />
                  Available Plans
                </h2>
                <p className="text-muted-foreground mt-1">Choose the plan that fits your strategy</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className="group hover:shadow-lg transition-all duration-300"
                >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-2">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground">{plan.description}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-500 to-emerald-500">
                          <Unlock className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4 p-4 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm">Daily Return</span>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{plan.daily_return}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm">Duration</span>
                          <span className="text-foreground font-medium">{plan.duration_days} Days</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border/50">
                          <span className="text-muted-foreground text-sm">Min. Stake</span>
                          <span className="text-foreground font-medium">₹{plan.min_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-primary text-sm flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Earn {plan.total_return_percent}% total return
                        </p>
                      </div>

                    <Button
                      onClick={() => handleOpenStakeDialog(plan)}
                      className="w-full"
                      size="lg"
                    >
                      Stake Now
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Active Positions */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Lock className="h-6 w-6 text-primary" />
                My Active Positions
              </h2>
              <p className="text-muted-foreground mt-1">Track your staking positions</p>
            </div>
            {positions.filter(p => p.status === 'active').length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Active Positions</h3>
                  <p className="text-muted-foreground mb-4">Start staking to earn passive income</p>
                  <Button
                    onClick={() => handleOpenStakeDialog()}
                    size="lg"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    Start Staking
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {positions
                  .filter(p => p.status === 'active')
                  .map((position) => (
                  <Card key={position.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-500 to-emerald-500">
                            <Unlock className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-foreground text-lg font-semibold">
                              {position.staking_plans?.name || 'Staking Position'}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              Started: {new Date(position.start_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 w-fit">
                          Active
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-muted-foreground text-sm mb-1">Staked Amount</p>
                          <p className="text-foreground font-semibold">₹{position.amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1">Total Earned</p>
                          <p className="text-green-600 dark:text-green-400 font-semibold">₹{position.total_earned?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1">Daily Earnings</p>
                          <p className="text-foreground font-semibold">₹{(position.daily_return_amount || 0).toFixed(4)}</p>
                        </div>
                      </div>

                      {position.end_date && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Time Remaining</span>
                            <span className="text-foreground font-medium">{getRemainingDays(position.end_date)} days</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, ((position.days_credited || 0) / (position.staking_plans?.duration_days || 1)) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          onClick={() => handleWithdraw(position)}
                        >
                          Withdraw
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Earnings History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Earnings History
              </CardTitle>
              <CardDescription>
                Your daily staking rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {earnings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Earnings Yet</h3>
                  <p className="text-muted-foreground">Your staking rewards will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {earnings.map((earning) => (
                    <div
                      key={earning.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-foreground font-medium">Daily Reward</p>
                          <p className="text-muted-foreground text-sm">
                            {new Date(earning.earned_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 dark:text-green-400 font-semibold">
                          +₹{earning.amount?.toFixed(4)}
                        </p>
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

      {/* Stake Dialog */}
      <Dialog open={isStakeDialogOpen} onOpenChange={setIsStakeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Stake USDT</DialogTitle>
            <DialogDescription>
              Choose your staking plan and amount to start earning
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Staking Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={stakingType === 'flexible' ? 'default' : 'outline'}
                onClick={() => setStakingType('flexible')}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Flexible
              </Button>
              <Button
                variant={stakingType === 'locked' ? 'default' : 'outline'}
                onClick={() => setStakingType('locked')}
              >
                <Lock className="h-4 w-4 mr-2" />
                Locked
              </Button>
            </div>

            {/* Duration Selection for Locked */}
            {stakingType === 'locked' && (
              <div>
                <Label>Lock Duration</Label>
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.duration_days.toString()}>
                        {plan.duration_days} Days - {plan.daily_return}% Daily
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <Label>Amount (USDT)</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder={`Min: ${currentPlan?.min_amount || 1} USDT`}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="pr-16"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStakeAmount(walletBalance.toString())}
                  className="absolute right-1 top-1 text-xs"
                >
                  MAX
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available: ₹{walletBalance.toLocaleString()}</p>
            </div>

            {/* Auto-Renew for Locked */}
            {stakingType === 'locked' && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <Label htmlFor="auto-renew-dialog">Auto-Renew</Label>
                </div>
                <Switch
                  id="auto-renew-dialog"
                  checked={autoRenew}
                  onCheckedChange={setAutoRenew}
                />
              </div>
            )}

            {/* Estimated Earnings */}
            {currentPlan && stakeAmount && parseFloat(stakeAmount) >= currentPlan.min_amount && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-muted-foreground text-sm mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Estimated Earnings
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Return:</span>
                    <span className="text-foreground font-semibold">{currentPlan.daily_return}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Earnings:</span>
                    <span className="text-foreground font-semibold">
                      ₹{(parseFloat(stakeAmount) * currentPlan.daily_return / 100).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Total ({currentPlan.duration_days} days):</span>
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      ₹{(parseFloat(stakeAmount) * currentPlan.daily_return / 100 * currentPlan.duration_days).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsStakeDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStake}
                disabled={!stakeAmount || parseFloat(stakeAmount) < (currentPlan?.min_amount || 1)}
                className="flex-1"
              >
                Stake Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default USDTStaking;
