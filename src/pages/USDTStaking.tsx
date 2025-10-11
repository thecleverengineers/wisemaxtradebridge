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
type StakingPosition = Database['public']['Tables']['staking_positions']['Row'] & {
  staking_plans?: StakingPlan;
};
type StakingEarning = Database['public']['Tables']['staking_earnings']['Row'];

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
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [earnings, setEarnings] = useState<StakingEarning[]>([]);
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
        .eq('is_active', true)
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
        .from('staking_positions')
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
      const { data, error } = await supabase
        .from('staking_earnings')
        .select('*')
        .eq('user_id', user?.id)
        .order('earned_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEarnings(data || []);
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
      return sum + calculateDailyEarnings(p.amount || 0, p.apy || 0);
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
    if (stakingType === 'flexible') {
      return plans.find(p => p.type === 'flexible');
    }
    return plans.find(p => p.type === 'locked' && p.duration_days === parseInt(selectedDuration));
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
      const endDate = currentPlan.type === 'locked' 
        ? new Date(Date.now() + currentPlan.duration_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: positionError } = await supabase
        .from('staking_positions')
        .insert({
          user_id: user?.id,
          plan_id: currentPlan.id,
          amount,
          apy: currentPlan.apy,
          duration_days: currentPlan.duration_days,
          type: currentPlan.type,
          end_date: endDate,
          auto_renew: currentPlan.type === 'locked' ? autoRenew : false,
          status: 'active'
        });

      if (positionError) throw positionError;

      const { error: recordError } = await supabase
        .from('usdtstaking_records')
        .insert({
          user_id: user?.id,
          plan_name: currentPlan.name,
          plan_type: currentPlan.type,
          amount,
          apy: currentPlan.apy,
          duration_days: currentPlan.duration_days,
          maturity_date: endDate,
          auto_renew: currentPlan.type === 'locked' ? autoRenew : false,
          status: 'active'
        });

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
        .insert({
          user_id: user?.id,
          type: 'stake',
          category: 'investment',
          currency: 'USDT',
          amount,
          status: 'completed',
          notes: `Staked in ${currentPlan.name}`
        });

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

  const handleWithdraw = async (position: StakingPosition) => {
    if (position.type === 'locked' && position.end_date && new Date(position.end_date) > new Date()) {
      const confirmed = window.confirm(
        "Early withdrawal will forfeit all earned interest. Are you sure you want to proceed?"
      );
      if (!confirmed) return;
    }

    try {
      const isEarlyWithdrawal = position.type === 'locked' && 
        position.end_date && new Date(position.end_date) > new Date();
      
      const returnAmount = !isEarlyWithdrawal
        ? position.amount + position.total_earned
        : position.amount;
      
      const penaltyAmount = isEarlyWithdrawal ? position.total_earned : 0;

      const { error: positionError } = await supabase
        .from('staking_positions')
        .update({ status: 'withdrawn' })
        .eq('id', position.id);

      if (positionError) throw positionError;

      const { error: recordError } = await supabase
        .from('usdtstaking_records')
        .update({ 
          status: 'withdrawn',
          withdrawn_amount: returnAmount,
          withdrawn_at: new Date().toISOString(),
          early_withdrawal: isEarlyWithdrawal,
          penalty_amount: penaltyAmount
        })
        .eq('user_id', user?.id)
        .eq('amount', position.amount)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

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
        .insert({
          user_id: user?.id,
          type: 'withdraw',
          category: 'investment',
          currency: 'USDT',
          amount: returnAmount,
          status: 'completed',
          notes: `Withdrawn from ${position.staking_plans?.name || 'staking'}${isEarlyWithdrawal ? ' (Early withdrawal - forfeited interest)' : ''}`
        });

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
      setStakingType(plan.type as 'flexible' | 'locked');
      if (plan.type === 'locked') {
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
    <div className="min-h-screen bg-slate-900">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-16 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white">USDT Staking</h1>
              <p className="text-sm md:text-base text-purple-300">Earn passive income with stable returns</p>
            </div>
            <Button 
              onClick={() => handleOpenStakeDialog()}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Stake Now
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-xs md:text-sm">Available Balance</p>
                    <p className="text-lg md:text-2xl font-bold text-white">₹{walletBalance.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-xs md:text-sm">Total Staked</p>
                    <p className="text-lg md:text-2xl font-bold text-white">
                      ₹{totalStats.totalStaked.toLocaleString()}
                    </p>
                  </div>
                  <Lock className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-xs md:text-sm">Total Earned</p>
                    <p className="text-lg md:text-2xl font-bold text-white">
                      ₹{totalStats.totalEarned.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-xs md:text-sm">Daily Earnings</p>
                    <p className="text-lg md:text-2xl font-bold text-white">
                      ₹{totalStats.dailyEarnings.toFixed(2)}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staking Plans */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center">
                <Percent className="h-5 w-5 mr-2 text-yellow-400" />
                Available Plans
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group"
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg font-semibold text-white mb-1">{plan.name}</h3>
                        <p className="text-xs md:text-sm text-gray-400">{plan.description}</p>
                      </div>
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${
                        plan.type === 'flexible' 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                        {plan.type === 'flexible' ? <Unlock className="h-5 w-5 md:h-6 md:w-6 text-white" /> : <Lock className="h-5 w-5 md:h-6 md:w-6 text-white" />}
                      </div>
                    </div>
                    
                    <div className="space-y-2 md:space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-300 text-xs md:text-sm">APY</span>
                        <span className="text-xl md:text-2xl font-bold text-green-400">{plan.apy}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-300 text-xs md:text-sm">Duration</span>
                        <span className="text-white text-sm md:text-base font-medium">
                          {plan.type === 'flexible' ? 'Flexible' : `${plan.duration_days} Days`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-300 text-xs md:text-sm">Min. Stake</span>
                        <span className="text-white text-sm md:text-base font-medium">₹{plan.min_amount}</span>
                      </div>
                    </div>

                    {plan.bonus_text && (
                      <div className="mb-4 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <p className="text-yellow-400 text-xs flex items-center">
                          <Gift className="h-3 w-3 mr-1" />
                          {plan.bonus_text}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() => handleOpenStakeDialog(plan)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm md:text-base"
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
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-purple-400" />
              My Active Positions
            </h2>
            {positions.filter(p => p.status === 'active').length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <Lock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-purple-300">No active staking positions</p>
                  <Button
                    onClick={() => handleOpenStakeDialog()}
                    className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    Start Staking
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {positions
                  .filter(p => p.status === 'active')
                  .map((position) => (
                  <Card key={position.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${
                            position.type === 'flexible' 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          }`}>
                            {position.type === 'flexible' ? <Unlock className="h-5 w-5 md:h-6 md:w-6 text-white" /> : <Lock className="h-5 w-5 md:h-6 md:w-6 text-white" />}
                          </div>
                          <div>
                            <h3 className="text-white text-sm md:text-base font-semibold">
                              {position.staking_plans?.name || (position.type === 'flexible' ? 'Flexible Staking' : `${position.duration_days} Days Locked`)}
                            </h3>
                            <p className="text-purple-300 text-xs md:text-sm">
                              Started: {new Date(position.start_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white w-fit">
                          Active
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                        <div>
                          <p className="text-purple-300 text-xs md:text-sm">Staked Amount</p>
                          <p className="text-white text-sm md:text-base font-semibold">₹{position.amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-purple-300 text-xs md:text-sm">APY</p>
                          <p className="text-white text-sm md:text-base font-semibold">{position.apy}%</p>
                        </div>
                        <div>
                          <p className="text-purple-300 text-xs md:text-sm">Total Earned</p>
                          <p className="text-green-400 text-sm md:text-base font-semibold">₹{position.total_earned?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-purple-300 text-xs md:text-sm">Daily Earnings</p>
                          <p className="text-white text-sm md:text-base font-semibold">₹{calculateDailyEarnings(position.amount, position.apy).toFixed(4)}</p>
                        </div>
                      </div>

                      {position.type === 'locked' && position.end_date && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs md:text-sm mb-2">
                            <span className="text-purple-300">Time Remaining</span>
                            <span className="text-white">{getRemainingDays(position.end_date)} days</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((position.duration_days - getRemainingDays(position.end_date)) / position.duration_days) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {position.auto_renew && (
                          <div className="flex items-center space-x-1 text-blue-400">
                            <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="text-xs md:text-sm">Auto-Renew ON</span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWithdraw(position)}
                          className="ml-auto border-white/10 text-xs md:text-sm"
                        >
                          {position.type === 'flexible' ? 'Withdraw' : 'Redeem'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Earnings History */}
          <div>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-base md:text-xl">
                  <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                  Earnings History
                </CardTitle>
                <CardDescription className="text-purple-300 text-xs md:text-sm">
                  Your daily staking rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                {earnings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-300">No earnings history yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {earnings.map((earning) => (
                      <div
                        key={earning.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white text-sm md:text-base font-medium">Daily Reward</p>
                            <p className="text-purple-300 text-xs md:text-sm">
                              {new Date(earning.earned_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 text-sm md:text-base font-semibold">
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
      </div>

      <BottomNavigation />

      {/* Stake Dialog */}
      <Dialog open={isStakeDialogOpen} onOpenChange={setIsStakeDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl">Stake USDT</DialogTitle>
            <DialogDescription className="text-purple-300 text-sm md:text-base">
              Choose your staking plan and amount
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Staking Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={stakingType === 'flexible' ? 'default' : 'outline'}
                onClick={() => setStakingType('flexible')}
                className={stakingType === 'flexible' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'border-white/10'}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Flexible
              </Button>
              <Button
                variant={stakingType === 'locked' ? 'default' : 'outline'}
                onClick={() => setStakingType('locked')}
                className={stakingType === 'locked' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'border-white/10'}
              >
                <Lock className="h-4 w-4 mr-2" />
                Locked
              </Button>
            </div>

            {/* Duration Selection for Locked */}
            {stakingType === 'locked' && (
              <div>
                <Label className="text-purple-300 text-sm md:text-base">Lock Duration</Label>
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans
                      .filter(p => p.type === 'locked')
                      .map(plan => (
                        <SelectItem key={plan.id} value={plan.duration_days.toString()}>
                          {plan.duration_days} Days - {plan.apy}% APY
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <Label className="text-purple-300 text-sm md:text-base">Amount (USDT)</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder={`Min: ${currentPlan?.min_amount || 1} USDT`}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white pr-20"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStakeAmount(walletBalance.toString())}
                  className="absolute right-1 top-1 text-purple-400 hover:text-purple-300 text-xs"
                >
                  MAX
                </Button>
              </div>
              <p className="text-xs text-purple-300 mt-1">Available: ₹{walletBalance.toLocaleString()}</p>
            </div>

            {/* Auto-Renew for Locked */}
            {stakingType === 'locked' && (
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-purple-400" />
                  <Label htmlFor="auto-renew-dialog" className="text-white text-sm md:text-base">Auto-Renew</Label>
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
              <div className="p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg border border-purple-500/20">
                <p className="text-purple-300 text-xs md:text-sm mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  Estimated Earnings
                </p>
                <div className="space-y-1 text-sm md:text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-400">APY:</span>
                    <span className="text-white font-semibold">{currentPlan.apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily:</span>
                    <span className="text-white font-semibold">
                      ₹{calculateDailyEarnings(parseFloat(stakeAmount), currentPlan.apy).toFixed(4)}
                    </span>
                  </div>
                  {stakingType === 'locked' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total ({currentPlan.duration_days} days):</span>
                      <span className="text-green-400 font-semibold">
                        ₹{calculateEstimatedEarnings(parseFloat(stakeAmount), currentPlan.apy, currentPlan.duration_days).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stake Button */}
            <Button
              onClick={handleStake}
              disabled={!currentPlan || !stakeAmount || parseFloat(stakeAmount) < (currentPlan?.min_amount || 1)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Confirm Stake
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default USDTStaking;
