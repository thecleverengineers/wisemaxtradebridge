
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, Star, Crown, Zap, Target, Award, ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'bonus' | 'achievement' | 'milestone' | 'daily';
  amount: number;
  requirement: number;
  current_progress: number;
  claimed: boolean;
  icon: any;
  color: string;
}

interface SalaryPayment {
  id: string;
  achievement_tier: string;
  amount: number;
  payment_month: number;
  paid_at: string;
}

const Rewards = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [currentTier, setCurrentTier] = useState<string>('None');
  const [tierReachedAt, setTierReachedAt] = useState<Date | null>(null);
  const [nextSalaryDate, setNextSalaryDate] = useState<Date | null>(null);
  
  const [activeTab, setActiveTab] = useState('available');
  const [totalRewards, setTotalRewards] = useState(0);

  useEffect(() => {
    if (user) {
      fetchRewards();
      fetchSalaryInfo();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscriptions for various tables that affect rewards
    const channels = [];

    // Subscribe to investments changes
    const investmentChannel = supabase
      .channel('rewards-investments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchRewards();
        }
      )
      .subscribe();
    channels.push(investmentChannel);

    // Subscribe to user changes (for referral count)
    const userChannel = supabase
      .channel('rewards-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `parent_id=eq.${user.id}`
        },
        () => {
          fetchRewards();
        }
      )
      .subscribe();
    channels.push(userChannel);

    // Subscribe to wallet changes (for ROI income)
    const walletChannel = supabase
      .channel('rewards-wallets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchRewards();
        }
      )
      .subscribe();
    channels.push(walletChannel);

    // Subscribe to referrals changes (for team deposits)
    const referralsChannel = supabase
      .channel('rewards-referrals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals'
        },
        () => {
          fetchRewards();
        }
      )
      .subscribe();
    channels.push(referralsChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user]);

  const fetchRewards = async () => {
    try {
      // Get user statistics for reward calculations
      const [investmentCount, referralCount, totalRoi] = await Promise.all([
        supabase.from('investments').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('parent_id', user?.id),
        supabase.from('wallets').select('roi_income').eq('user_id', user?.id).single()
      ]);

      const userInvestments = investmentCount.count || 0;
      const userReferrals = referralCount.count || 0;
      const userRoi = totalRoi.data?.roi_income || 0;

      // Fetch team achievements data
      let totalTeamDeposits = 0;
      let teamAchievementsData: any[] = [];
      let userProgressData: any[] = [];

      try {
        const [achievementsRes, progressRes, depositsRes] = await Promise.all([
          supabase
            .from('team_achievements')
            .select('*')
            .order('milestone_amount', { ascending: true }),
          supabase
            .from('user_achievement_progress')
            .select('*')
            .eq('user_id', user?.id),
          supabase
            .rpc('calculate_team_deposits', { referrer_user_id: user?.id })
        ]);

        teamAchievementsData = achievementsRes.data || [];
        userProgressData = progressRes.data || [];
        totalTeamDeposits = Number(depositsRes.data) || 0;
      } catch (err) {
        console.log('Team achievements not yet available:', err);
      }

      // Define standard rewards
      const standardRewards: Reward[] = [
        {
          id: '1',
          title: 'Welcome Bonus',
          description: 'Complete your first investment to get ₹5 bonus',
          type: 'milestone',
          amount: 5,
          requirement: 1,
          current_progress: userInvestments,
          claimed: userInvestments >= 1,
          icon: Gift,
          color: 'from-green-500 to-emerald-600'
        },
        {
          id: '2',
          title: 'Referral Master',
          description: 'Refer 5 friends and earn ₹5 bonus',
          type: 'achievement',
          amount: 5,
          requirement: 5,
          current_progress: userReferrals,
          claimed: userReferrals >= 5,
          icon: Star,
          color: 'from-blue-500 to-indigo-600'
        },
        {
          id: '3',
          title: 'Investment Pro',
          description: 'Make 10 investments to unlock ₹2000 bonus',
          type: 'milestone',
          amount: 2000,
          requirement: 10,
          current_progress: userInvestments,
          claimed: userInvestments >= 10,
          icon: Crown,
          color: 'from-yellow-500 to-orange-600'
        },
        {
          id: '6',
          title: 'Daily Login',
          description: 'Login daily for 30 days - ₹0.5/day',
          type: 'daily',
          amount: 0.5,
          requirement: 30,
          current_progress: 15, // Mock progress
          claimed: false,
          icon: Calendar,
          color: 'from-teal-500 to-cyan-600'
        }
      ];

      // Add team achievement rewards
      const teamRewards: Reward[] = (teamAchievementsData || []).map((achievement: any) => {
        const progress = userProgressData?.find((p: any) => p.achievement_id === achievement.id);
        const isClaimed = progress?.reward_credited || false;
        
        return {
          id: `team-${achievement.id}`,
          title: `Team $${(achievement.milestone_amount / 1000).toFixed(0)}K Milestone`,
          description: achievement.description,
          type: 'achievement' as const,
          amount: Number(achievement.reward_amount || 0),
          requirement: Number(achievement.milestone_amount || 0),
          current_progress: totalTeamDeposits,
          claimed: isClaimed || (achievement.reward_amount === 0 && totalTeamDeposits >= achievement.milestone_amount),
          icon: Crown,
          color: achievement.reward_amount > 500 ? 'from-yellow-500 to-orange-600' : 'from-blue-500 to-cyan-600'
        };
      });

      const allRewards = [...standardRewards, ...teamRewards];
      setRewards(allRewards);
      setTotalRewards(allRewards.filter(r => r.claimed && r.amount > 0).reduce((sum, r) => sum + r.amount, 0));

    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast({
        title: "Error",
        description: "Failed to load rewards data",
        variant: "destructive",
      });
    }
  };

  const fetchSalaryInfo = async () => {
    try {
      // Get user's salary payments
      const { data: payments } = await supabase
        .from('salary_payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('payment_month', { ascending: true });

      setSalaryPayments(payments || []);

      // Get current achievement tier
      const { data: tierData } = await supabase
        .rpc('get_user_achievement_tier', { p_user_id: user?.id });

      setCurrentTier(tierData || 'None');

      // Get tier reached date from achievement progress
      const { data: progress } = await supabase
        .from('user_achievement_progress')
        .select('tier_reached_at')
        .eq('user_id', user?.id)
        .not('tier_reached_at', 'is', null)
        .order('tier_reached_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (progress?.tier_reached_at) {
        const reachedDate = new Date(progress.tier_reached_at);
        setTierReachedAt(reachedDate);

        // Calculate next salary date (30 days from last payment or tier reached date)
        const lastPayment = payments && payments.length > 0 
          ? new Date(payments[payments.length - 1].paid_at)
          : reachedDate;
        
        const nextDate = new Date(lastPayment);
        nextDate.setDate(nextDate.getDate() + 30);
        setNextSalaryDate(nextDate);
      }
    } catch (error) {
      console.error('Error fetching salary info:', error);
    }
  };

  const getTierSalaryAmount = (tier: string): number => {
    const salaries: Record<string, number> = {
      'Bronze': 50,
      'Silver': 75,
      'Gold': 100,
      'Platinum': 120,
      'Diamond': 130,
      'Master': 150,
      'Grandmaster': 200,
      'Elite': 300,
      'Legend': 400,
      'Mythic': 500
    };
    return salaries[tier] || 0;
  };

  const claimReward = async (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || reward.claimed || reward.current_progress < reward.requirement) return;

    try {
      // In a real app, you would update the database here
      toast({
        title: "Reward Claimed!",
        description: `You've earned ₹${reward.amount} bonus!`,
      });

      // Update local state
      setRewards(prev => prev.map(r => 
        r.id === rewardId ? { ...r, claimed: true } : r
      ));
      setTotalRewards(prev => prev + reward.amount);

    } catch (error) {
      console.error('Error claiming reward:', error);
      toast({
        title: "Claim Failed",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFilteredRewards = () => {
    switch (activeTab) {
      case 'available':
        return rewards.filter(r => !r.claimed && r.current_progress >= r.requirement);
      case 'claimed':
        return rewards.filter(r => r.claimed);
      default:
        return rewards;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="hover-scale"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Rewards Center
                </h1>
                <p className="text-muted-foreground mt-1">Earn bonuses and unlock achievements</p>
              </div>
            </div>
          </div>

          {/* Total Rewards Earned */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent border-0 text-primary-foreground shadow-2xl animate-scale-in">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardContent className="relative p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm uppercase tracking-wide mb-2">Total Rewards Earned</p>
                  <p className="text-5xl font-bold mb-1">₹{totalRewards.toLocaleString()}</p>
                  <p className="text-primary-foreground/60 text-sm">Keep earning to unlock more!</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                  <Award className="relative h-16 w-16 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Salary Status */}
          {currentTier !== 'None' && getTierSalaryAmount(currentTier) > 0 && (
            <Card className="relative overflow-hidden border-2 border-primary/20 shadow-xl animate-fade-in">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-primary" />
                      Monthly Salary Program
                    </CardTitle>
                    <CardDescription className="mt-2">
                      You're enrolled in the {currentTier} tier salary program
                    </CardDescription>
                  </div>
                  <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 px-4 py-2 text-lg">
                    ${getTierSalaryAmount(currentTier)}/month
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-6">
                {/* Salary Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Payments Received</p>
                    <p className="text-2xl font-bold text-primary">{salaryPayments.length}/6</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${salaryPayments.reduce((sum, p) => sum + Number(p.amount), 0)}
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
                    <p className="text-2xl font-bold">
                      {salaryPayments.length < 6 && nextSalaryDate
                        ? nextSalaryDate.toLocaleDateString()
                        : salaryPayments.length >= 6
                        ? 'Completed'
                        : 'TBD'}
                    </p>
                  </div>
                </div>

                {/* Salary Chart - Visualize monthly payments */}
                <div className="mt-6 p-6 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Salary Payment Schedule
                  </h4>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((month) => {
                      const isPaid = salaryPayments.some(p => p.payment_month === month);
                      const isNext = !isPaid && month === (salaryPayments.length + 1);
                      return (
                        <div
                          key={month}
                          className={`
                            relative p-4 rounded-lg text-center transition-all duration-300
                            ${isPaid 
                              ? 'bg-green-500/20 border-2 border-green-500' 
                              : isNext
                              ? 'bg-primary/20 border-2 border-primary animate-pulse'
                              : 'bg-muted border-2 border-border'}
                          `}
                        >
                          <div className="text-xs text-muted-foreground mb-1">Month {month}</div>
                          <div className={`text-sm font-bold ${isPaid ? 'text-green-600' : isNext ? 'text-primary' : 'text-muted-foreground'}`}>
                            ${getTierSalaryAmount(currentTier)}
                          </div>
                          {isPaid && (
                            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                              <Award className="h-3 w-3 text-white" />
                            </div>
                          )}
                          {isNext && (
                            <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                              <Calendar className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500/20 border border-green-500 rounded"></div>
                      <span>Paid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-primary/20 border border-primary rounded"></div>
                      <span>Next</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-muted border border-border rounded"></div>
                      <span>Pending</span>
                    </div>
                  </div>
                </div>

                {/* Payment Timeline */}
                {salaryPayments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Payment History
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {salaryPayments.map((payment, index) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{payment.payment_month}</span>
                            </div>
                            <div>
                              <p className="font-medium">Month {payment.payment_month}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(payment.paid_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-700">
                            +${payment.amount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remaining Payments */}
                {salaryPayments.length < 6 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Remaining Salary Payments</p>
                    <div className="flex items-center gap-2">
                      <Progress value={(salaryPayments.length / 6) * 100} className="flex-1" />
                      <span className="text-sm font-bold">{6 - salaryPayments.length} left</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      You'll receive ${getTierSalaryAmount(currentTier)} every 30 days for {6 - salaryPayments.length} more months
                    </p>
                  </div>
                )}

                {salaryPayments.length >= 6 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                    <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-bold text-green-700">Salary Program Completed!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You've received all 6 monthly payments for the {currentTier} tier
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Category Tabs */}
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex space-x-3 overflow-x-auto">
                <Button
                  onClick={() => setActiveTab('available')}
                  variant={activeTab === 'available' ? 'default' : 'outline'}
                  className="hover-scale transition-all"
                  size="lg"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Available ({rewards.filter(r => !r.claimed && r.current_progress >= r.requirement).length})
                </Button>
                <Button
                  onClick={() => setActiveTab('claimed')}
                  variant={activeTab === 'claimed' ? 'default' : 'outline'}
                  className="hover-scale transition-all"
                  size="lg"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Claimed ({rewards.filter(r => r.claimed).length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rewards List */}
          <div className="space-y-4">
            {getFilteredRewards().map((reward, index) => (
              <Card 
                key={reward.id} 
                className="group hover:shadow-xl transition-all duration-300 border-border/50 animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`relative p-4 rounded-xl bg-gradient-to-br ${reward.color} shadow-lg group-hover:scale-110 transition-transform`}>
                        <div className="absolute inset-0 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <reward.icon className="relative h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-bold text-lg">{reward.title}</h3>
                          <Badge 
                            variant="outline"
                            className="capitalize border-primary/30 bg-primary/10"
                          >
                            {reward.type}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">{reward.description}</p>
                        
                        {!reward.claimed && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="text-primary">
                                {Math.min(reward.current_progress, reward.requirement).toLocaleString()}/{reward.requirement.toLocaleString()}
                              </span>
                            </div>
                            <div className="relative">
                              <Progress 
                                value={(reward.current_progress / reward.requirement) * 100} 
                                className="h-3"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            </div>
                          </div>
                        )}
                        
                        {reward.claimed && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                            <Award className="h-3 w-3 mr-1" />
                            Claimed Successfully
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-3">
                      <div className="bg-gradient-to-br from-primary/10 to-accent/10 px-4 py-2 rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">Reward</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          ₹{reward.amount.toLocaleString()}
                        </p>
                      </div>
                      {!reward.claimed && reward.current_progress >= reward.requirement && (
                        <Button
                          onClick={() => claimReward(reward.id)}
                          size="lg"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all hover-scale"
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          Claim Now
                        </Button>
                      )}
                      {!reward.claimed && reward.current_progress < reward.requirement && (
                        <div className="text-center bg-muted/50 px-4 py-2 rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground">
                            {(reward.requirement - reward.current_progress).toLocaleString()} more needed
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {getFilteredRewards().length === 0 && (
            <Card className="border-dashed border-2 border-border/50 bg-muted/20 animate-fade-in">
              <CardContent className="p-16 text-center">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <Gift className="relative h-20 w-20 text-primary mx-auto" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Rewards Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {activeTab === 'available' && "Complete more activities to unlock rewards that are ready to claim!"}
                  {activeTab === 'claimed' && "Start earning rewards by completing challenges and milestones."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Team Deposit Reward Chart */}
          <Card className="border-border/50 shadow-xl overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-6 border-b border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Team Deposit Reward Levels</CardTitle>
                  <CardDescription className="mt-1">
                    Earn exponential rewards as your team's total deposits grow
                  </CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wide">Achievement Tier</th>
                      <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wide">Total Team Deposit</th>
                      <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wide">Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold bg-gradient-to-r from-orange-600/20 to-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30">🥉 Bronze</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$5,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$50 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold bg-gradient-to-r from-gray-400/20 to-gray-300/20 text-gray-700 dark:text-gray-300 border-gray-400/30">🥈 Silver</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$10,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$100 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">🥇 Gold</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$20,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$200 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold bg-gradient-to-r from-cyan-500/20 to-cyan-400/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30">💎 Platinum</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$90,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$600 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group bg-primary/5">
                      <td className="py-4 px-6">
                        <Badge className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">💠 Diamond</Badge>
                      </td>
                      <td className="py-4 px-6 font-bold">$150,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg">$700 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold bg-gradient-to-r from-purple-600/20 to-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30">👑 Master</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$250,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$800 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold bg-gradient-to-r from-red-600/20 to-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">⚔️ Grandmaster</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$500,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$900 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group bg-accent/5">
                      <td className="py-4 px-6">
                        <Badge className="font-semibold bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0">🏆 Elite</Badge>
                      </td>
                      <td className="py-4 px-6 font-bold">$1,000,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg">$1,000 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="secondary" className="font-semibold bg-gradient-to-r from-pink-600/20 to-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-500/30">⭐ Legend</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$1,300,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-yellow-600 dark:text-yellow-400 font-bold">TBD</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="secondary" className="font-semibold bg-gradient-to-r from-indigo-600/20 to-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-500/30">🌟 Mythic</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$2,000,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-yellow-600 dark:text-yellow-400 font-bold">TBD</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/50 transition-colors bg-muted/30">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold bg-gradient-to-r from-primary/20 to-accent/20">✨ Champion+</Badge>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground italic">Higher tiers available</td>
                      <td className="py-4 px-6 text-muted-foreground italic">Contact support</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 p-5 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl border border-primary/20 shadow-inner">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Pro Tip</p>
                    <p className="text-sm text-muted-foreground">
                      Build your team strategically to unlock higher reward tiers. Each level brings exponentially bigger rewards!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reward Tips */}
          <Card className="border-border/50 shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                How to Earn More Rewards
              </CardTitle>
              <CardDescription>Maximize your earnings with these strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover-scale transition-all">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    Make Investments
                  </h4>
                  <p>Regular investments unlock milestone bonuses and increase your earning potential.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">👥 Refer Friends</h4>
                  <p>Share your referral code to earn generous bonuses for each successful referral.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">📅 Stay Active</h4>
                  <p>Daily login streaks and consistent activity unlock special rewards.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">🎯 Complete Challenges</h4>
                  <p>Participate in special events and challenges for bonus rewards.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Rewards;
