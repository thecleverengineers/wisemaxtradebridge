import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface StakingPlan {
  id: string;
  type: 'flexible' | 'locked';
  duration: number; // in days, 0 for flexible
  apy: number;
  minAmount: number;
  maxAmount: number;
  description: string;
  bonus?: string;
}

interface StakingPosition {
  id: string;
  amount: number;
  planId: string;
  startDate: string;
  endDate?: string;
  apy: number;
  duration: number;
  type: 'flexible' | 'locked';
  autoRenew: boolean;
  totalEarned: number;
  dailyEarnings: number;
  status: 'active' | 'completed' | 'withdrawn';
}

const USDTStaking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('stake');
  const [stakingType, setStakingType] = useState<'flexible' | 'locked'>('flexible');
  const [selectedDuration, setSelectedDuration] = useState('30');
  const [stakeAmount, setStakeAmount] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [positions, setPositions] = useState<StakingPosition[]>([]);

  // Staking plans configuration
  const stakingPlans: StakingPlan[] = [
    { id: 'flex', type: 'flexible', duration: 0, apy: 3.5, minAmount: 1, maxAmount: 1000000, description: 'Withdraw anytime' },
    { id: 'lock7', type: 'locked', duration: 7, apy: 5.0, minAmount: 10, maxAmount: 1000000, description: '7 days lock-up' },
    { id: 'lock30', type: 'locked', duration: 30, apy: 7.5, minAmount: 10, maxAmount: 1000000, description: '30 days lock-up', bonus: '🎁 +0.5% Bonus APY' },
    { id: 'lock60', type: 'locked', duration: 60, apy: 9.0, minAmount: 10, maxAmount: 1000000, description: '60 days lock-up' },
    { id: 'lock90', type: 'locked', duration: 90, apy: 12.0, minAmount: 10, maxAmount: 1000000, description: '90 days lock-up', bonus: '🚀 +1% Bonus APY' },
  ];

  const currentPlan = stakingType === 'flexible' 
    ? stakingPlans[0] 
    : stakingPlans.find(p => p.duration === parseInt(selectedDuration)) || stakingPlans[1];

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchStakingPositions();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .eq('currency', 'USDT')
        .single();

      if (error) throw error;
      setWalletBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchStakingPositions = async () => {
    // Mock data for demonstration
    const mockPositions: StakingPosition[] = [
      {
        id: '1',
        amount: 1000,
        planId: 'lock30',
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        apy: 7.5,
        duration: 30,
        type: 'locked',
        autoRenew: true,
        totalEarned: 6.16,
        dailyEarnings: 0.205,
        status: 'active'
      },
      {
        id: '2',
        amount: 500,
        planId: 'flex',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        apy: 3.5,
        duration: 0,
        type: 'flexible',
        autoRenew: false,
        totalEarned: 1.44,
        dailyEarnings: 0.048,
        status: 'active'
      }
    ];
    setPositions(mockPositions);
  };

  const calculateDailyEarnings = (amount: number, apy: number) => {
    return (amount * (apy / 100)) / 365;
  };

  const calculateEstimatedEarnings = (amount: number, apy: number, days: number) => {
    const dailyRate = apy / 365 / 100;
    return amount * dailyRate * days;
  };

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (!amount || amount < currentPlan.minAmount) {
      toast({
        title: "Invalid Amount",
        description: `Minimum stake amount is ${currentPlan.minAmount} USDT`,
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

    // Here you would implement the actual staking logic with Supabase
    toast({
      title: "Staking Successful",
      description: `Successfully staked ${amount} USDT for ${currentPlan.duration || 'flexible'} days at ${currentPlan.apy}% APY`,
    });
    
    setStakeAmount('');
    fetchWalletBalance();
    fetchStakingPositions();
  };

  const handleWithdraw = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (position?.type === 'locked' && new Date(position.endDate!) > new Date()) {
      toast({
        title: "Early Withdrawal",
        description: "You will lose all earned interest if you withdraw early. Are you sure?",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Withdrawal Successful",
        description: "Your USDT has been returned to your wallet",
      });
    }
  };

  const getRemainingDays = (endDate: string) => {
    const remaining = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">USDT Staking</h1>
            <p className="text-purple-300">Earn passive income with stable returns</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm">Available Balance</p>
                    <p className="text-2xl font-bold text-white">₹{walletBalance.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm">Total Staked</p>
                    <p className="text-2xl font-bold text-white">
                      ₹{positions.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <Lock className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm">Total Earned</p>
                    <p className="text-2xl font-bold text-white">
                      ₹{positions.reduce((sum, p) => sum + p.totalEarned, 0).toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm">Daily Earnings</p>
                    <p className="text-2xl font-bold text-white">
                      ₹{positions.reduce((sum, p) => sum + p.dailyEarnings, 0).toFixed(2)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-white/5 border-white/10">
              <TabsTrigger value="stake">Stake USDT</TabsTrigger>
              <TabsTrigger value="positions">My Positions</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="stake" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Staking Form */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Stake Your USDT</CardTitle>
                    <CardDescription className="text-purple-300">
                      Choose between flexible or locked staking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                        <Label className="text-purple-300">Lock Duration</Label>
                        <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                            <SelectItem value="60">60 Days</SelectItem>
                            <SelectItem value="90">90 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Amount Input */}
                    <div>
                      <Label className="text-purple-300">Amount (USDT)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder={`Min: ${currentPlan.minAmount} USDT`}
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="bg-white/5 border-white/10 text-white pr-20"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setStakeAmount(walletBalance.toString())}
                          className="absolute right-1 top-1 text-purple-400 hover:text-purple-300"
                        >
                          MAX
                        </Button>
                      </div>
                    </div>

                    {/* Auto-Renew for Locked */}
                    {stakingType === 'locked' && (
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="h-4 w-4 text-purple-400" />
                          <Label htmlFor="auto-renew" className="text-white">Auto-Renew</Label>
                        </div>
                        <Switch
                          id="auto-renew"
                          checked={autoRenew}
                          onCheckedChange={setAutoRenew}
                        />
                      </div>
                    )}

                    {/* Estimated Earnings */}
                    {stakeAmount && parseFloat(stakeAmount) >= currentPlan.minAmount && (
                      <div className="p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg border border-purple-500/20">
                        <p className="text-purple-300 text-sm mb-2">Estimated Earnings</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Daily:</span>
                            <span className="text-white font-semibold">
                              ₹{calculateDailyEarnings(parseFloat(stakeAmount), currentPlan.apy).toFixed(4)}
                            </span>
                          </div>
                          {stakingType === 'locked' && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total ({currentPlan.duration} days):</span>
                              <span className="text-white font-semibold">
                                ₹{calculateEstimatedEarnings(parseFloat(stakeAmount), currentPlan.apy, currentPlan.duration).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stake Button */}
                    <Button
                      onClick={handleStake}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      Stake USDT
                    </Button>
                  </CardContent>
                </Card>

                {/* Plans Info */}
                <div className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Percent className="h-5 w-5 mr-2 text-yellow-400" />
                        Current APY Rates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {stakingPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            currentPlan.id === plan.id 
                              ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30' 
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-semibold">
                                {plan.type === 'flexible' ? 'Flexible' : `${plan.duration} Days`}
                              </p>
                              <p className="text-gray-400 text-sm">{plan.description}</p>
                              {plan.bonus && (
                                <p className="text-yellow-400 text-sm mt-1">{plan.bonus}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-400">{plan.apy}%</p>
                              <p className="text-gray-400 text-sm">APY</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Features */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-blue-400" />
                        Staking Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                        <div>
                          <p className="text-white">Daily Interest Payouts</p>
                          <p className="text-gray-400 text-sm">Rewards calculated and paid daily</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                        <div>
                          <p className="text-white">No Price Risk</p>
                          <p className="text-gray-400 text-sm">USDT is pegged to USD</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                        <div>
                          <p className="text-white">Low Entry Barrier</p>
                          <p className="text-gray-400 text-sm">Start with as little as 1 USDT</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                        <div>
                          <p className="text-white">Compound Interest</p>
                          <p className="text-gray-400 text-sm">Auto-renew to maximize returns</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="positions" className="space-y-4">
              {positions.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 text-center">
                    <Lock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-300">No active staking positions</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {positions.map((position) => (
                    <Card key={position.id} className="bg-white/5 border-white/10">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              position.type === 'flexible' 
                                ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                                : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                            }`}>
                              {position.type === 'flexible' ? <Unlock className="h-6 w-6 text-white" /> : <Lock className="h-6 w-6 text-white" />}
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">
                                {position.type === 'flexible' ? 'Flexible Staking' : `${position.duration} Days Locked`}
                              </h3>
                              <p className="text-purple-300 text-sm">
                                Started: {new Date(position.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${
                            position.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                          } text-white`}>
                            {position.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-purple-300 text-sm">Staked Amount</p>
                            <p className="text-white font-semibold">₹{position.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-purple-300 text-sm">APY</p>
                            <p className="text-white font-semibold">{position.apy}%</p>
                          </div>
                          <div>
                            <p className="text-purple-300 text-sm">Total Earned</p>
                            <p className="text-green-400 font-semibold">₹{position.totalEarned.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-purple-300 text-sm">Daily Earnings</p>
                            <p className="text-white font-semibold">₹{position.dailyEarnings.toFixed(4)}</p>
                          </div>
                        </div>

                        {position.type === 'locked' && position.endDate && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-purple-300">Time Remaining</span>
                              <span className="text-white">{getRemainingDays(position.endDate)} days</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${((position.duration - getRemainingDays(position.endDate)) / position.duration) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          {position.autoRenew && (
                            <div className="flex items-center space-x-1 text-blue-400">
                              <RefreshCw className="h-4 w-4" />
                              <span className="text-sm">Auto-Renew ON</span>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleWithdraw(position.id)}
                            className="ml-auto border-white/10"
                          >
                            {position.type === 'flexible' ? 'Withdraw' : 'Redeem'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Staking History</CardTitle>
                  <CardDescription className="text-purple-300">
                    View your completed and withdrawn stakes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-300">No staking history yet</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default USDTStaking;