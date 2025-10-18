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
  const [records, setRecords] = useState<StakingRecord[]>([]);
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
    // Subscribe to staking records changes
    const recordsChannel = supabase
      .channel('staking-records-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staking_records',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchRecords();
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
      supabase.removeChannel(recordsChannel);
      supabase.removeChannel(walletChannel);
    };
  };

  const fetchData = async () => {
    await Promise.all([
      fetchPlans(),
      fetchRecords(),
      fetchWalletBalance()
    ]);
    calculateStats();
  };

  const fetchPlans = async () => {
    try {
      const { data, error} = await supabase
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

  const fetchRecords = async () => {
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
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .eq('currency', 'USDT')
        .maybeSingle();

      if (error) throw error;
      setWalletBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setWalletBalance(0);
    }
  };

  const calculateStats = () => {
    const activeRecords = records.filter(r => r.status === 'active');
    
    const totalStaked = activeRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalEarned = records.reduce((sum, r) => sum + (r.total_earned || 0), 0);
    const dailyEarnings = activeRecords.reduce((sum, r) => {
      const dailyReturn = r.daily_return_amount || 0;
      return sum + dailyReturn;
    }, 0);

    setTotalStats({
      totalStaked,
      totalEarned,
      dailyEarnings
    });
  };

  const getCurrentPlan = () => {
    // Return the first plan for flexible, or match by duration for locked
    if (stakingType === 'flexible') {
      return plans.find(p => p.duration_days === 0) || plans[0];
    }
    return plans.find(p => p.duration_days === parseInt(selectedDuration)) || plans[0];
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
      const endDate = currentPlan.duration_days > 0
        ? new Date(Date.now() + currentPlan.duration_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const dailyReturnAmount = (amount * currentPlan.daily_return) / 100;
      const totalExpected = (amount * currentPlan.total_return_percent) / 100;

      const { error: recordError } = await supabase
        .from('staking_records')
        .insert({
          user_id: user?.id,
          plan_id: currentPlan.id,
          amount,
          daily_return_amount: dailyReturnAmount,
          total_expected: totalExpected,
          start_date: new Date().toISOString(),
          end_date: endDate,
          status: 'active'
        });

      if (recordError) throw recordError;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: walletBalance - amount
        })
        .eq('user_id', user?.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

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

  const handleWithdraw = async (record: StakingRecord) => {
    const isEarly = record.end_date && new Date(record.end_date) > new Date();
    
    if (isEarly) {
      const confirmed = window.confirm(
        "Early withdrawal will forfeit all earned interest. Are you sure you want to proceed?"
      );
      if (!confirmed) return;
    }

    try {
      const returnAmount = !isEarly
        ? record.amount + (record.total_earned || 0)
        : record.amount;

      const { error: recordError } = await supabase
        .from('staking_records')
        .update({ status: 'withdrawn' })
        .eq('id', record.id);

      if (recordError) throw recordError;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: walletBalance + returnAmount
        })
        .eq('user_id', user?.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

      toast({
        title: "Withdrawal Successful",
        description: `Successfully withdrawn ${returnAmount.toFixed(2)} USDT${isEarly ? ' (Early withdrawal - interest forfeited)' : ''}`,
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
      setStakingType(plan.duration_days === 0 ? 'flexible' : 'locked');
      if (plan.duration_days > 0) {
        setSelectedDuration(plan.duration_days.toString());
      }
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
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                        plan.duration_days === 0 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                        {plan.duration_days === 0 ? <Unlock className="h-6 w-6 text-white" /> : <Lock className="h-6 w-6 text-white" />}
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4 p-4 rounded-lg bg-muted/50">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Daily Return</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{plan.daily_return}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Duration</span>
                        <span className="text-foreground font-medium">
                          {plan.duration_days === 0 ? 'Flexible' : `${plan.duration_days} Days`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border/50">
                        <span className="text-muted-foreground text-sm">Min. Stake</span>
                        <span className="text-foreground font-medium">₹{plan.min_amount.toLocaleString()}</span>
                      </div>
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

          {/* Active Records */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Lock className="h-6 w-6 text-primary" />
                My Active Staking
              </h2>
              <p className="text-muted-foreground mt-1">Track your staking records</p>
            </div>
            {records.filter(r => r.status === 'active').length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Active Staking</h3>
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
                {records
                  .filter(r => r.status === 'active')
                  .map((record) => (
                  <Card key={record.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                            !record.end_date 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          }`}>
                            {!record.end_date ? <Unlock className="h-6 w-6 text-white" /> : <Lock className="h-6 w-6 text-white" />}
                          </div>
                          <div>
                            <h3 className="text-foreground text-lg font-semibold">
                              {record.staking_plans?.name || (!record.end_date ? 'Flexible Staking' : `${record.staking_plans?.duration_days} Days Locked`)}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              Started: {new Date(record.start_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 w-fit">
                          Active
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-muted-foreground text-sm mb-1">Staked Amount</p>
                          <p className="text-foreground font-semibold">₹{record.amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1">Daily Return</p>
                          <p className="text-foreground font-semibold">₹{record.daily_return_amount?.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1">Total Earned</p>
                          <p className="text-green-600 dark:text-green-400 font-semibold">₹{record.total_earned?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1">Expected Total</p>
                          <p className="text-foreground font-semibold">₹{record.total_expected?.toFixed(2)}</p>
                        </div>
                      </div>

                      {record.end_date && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Time Remaining</span>
                            <span className="text-foreground font-medium">{getRemainingDays(record.end_date)} days</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((record.days_credited || 0) / (record.staking_plans?.duration_days || 1)) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          onClick={() => handleWithdraw(record)}
                        >
                          {!record.end_date ? 'Withdraw' : 'Redeem'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

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
                    {plans
                      .filter(p => p.duration_days > 0)
                      .map(plan => (
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
                      ₹{((parseFloat(stakeAmount) * currentPlan.daily_return) / 100).toFixed(4)}
                    </span>
                  </div>
                  {stakingType === 'locked' && currentPlan.duration_days > 0 && (
                    <div className="flex justify-between pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">Total ({currentPlan.duration_days} days):</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        ₹{((parseFloat(stakeAmount) * currentPlan.total_return_percent) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
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
