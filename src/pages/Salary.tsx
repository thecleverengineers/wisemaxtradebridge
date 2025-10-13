import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, TrendingUp, Trophy, Crown, Star, Gift, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface Achievement {
  id: string;
  name: string;
  description: string;
  milestone_amount: number;
  reward_amount: number;
  color: string;
  icon: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  is_claimed: boolean;
  claimed_at: string | null;
  tier_reached_at: string | null;
}

interface SalaryPayment {
  id: string;
  achievement_tier: string;
  amount: number;
  payment_month: number;
  paid_at: string;
  tier_reached_at: string;
}

const Salary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [totalTeamDeposits, setTotalTeamDeposits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('team_achievements')
        .select('*')
        .order('milestone_amount', { ascending: true });

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_achievement_progress')
        .select('*')
        .eq('user_id', user?.id);

      // Fetch salary payments
      const { data: paymentsData } = await supabase
        .from('salary_payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('payment_month', { ascending: true });

      // Calculate total team deposits
      const { data: depositsData } = await supabase
        .rpc('calculate_team_deposits', { referrer_user_id: user?.id });

      setAchievements(achievementsData || []);
      setUserProgress(progressData || []);
      setSalaryPayments(paymentsData || []);
      setTotalTeamDeposits(Number(depositsData) || 0);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      toast({
        title: "Error",
        description: "Failed to load salary information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const claimTierReward = async (achievementId: string, achievementName: string, rewardAmount: number) => {
    if (claimingId || rewardAmount === 0) return;
    
    try {
      setClaimingId(achievementId);
      
      // Update user progress to mark as claimed
      const { error: updateError } = await supabase
        .from('user_achievement_progress')
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          tier_reached_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('achievement_id', achievementId);

      if (updateError) throw updateError;

      // Credit the reward to user's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, bonus_income')
        .eq('user_id', user?.id)
        .single();

      if (wallet) {
        const newBalance = Number(wallet.balance) + rewardAmount;
        
        await supabase
          .from('wallets')
          .update({
            balance: newBalance,
            bonus_income: Number(wallet.bonus_income) + rewardAmount
          })
          .eq('user_id', user?.id);

        // Create transaction record
        await supabase
          .from('transactions')
          .insert({
            user_id: user?.id,
            type: 'credit',
            amount: rewardAmount,
            balance_after: newBalance,
            category: 'achievement',
            income_type: 'tier_reward',
            reason: `Achievement reward - ${achievementName}`,
            status: 'completed'
          });

        toast({
          title: "Reward Claimed!",
          description: `$${rewardAmount} has been credited to your wallet`,
        });

        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast({
        title: "Claim Failed",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setClaimingId(null);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      trophy: Trophy,
      crown: Crown,
      star: Star,
      gift: Gift
    };
    return icons[iconName] || Trophy;
  };

  const getTotalSalaryEarned = () => {
    return salaryPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  };

  const getActiveTier = () => {
    const claimedProgress = userProgress.filter(p => p.is_claimed && p.tier_reached_at);
    if (claimedProgress.length === 0) return null;
    
    const activeTier = claimedProgress[claimedProgress.length - 1];
    const achievement = achievements.find(a => a.id === activeTier.achievement_id);
    return { progress: activeTier, achievement };
  };

  const activeTier = getActiveTier();

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
                onClick={() => navigate('/dashboard')}
                className="hover-scale"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Monthly Salary Program
                </h1>
                <p className="text-muted-foreground mt-1">Claim tier rewards and track salary payments</p>
              </div>
            </div>
          </div>

          {/* Total Salary Earned */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent border-0 text-primary-foreground shadow-2xl animate-scale-in">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardContent className="relative p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm uppercase tracking-wide mb-2">Total Salary Earned</p>
                  <p className="text-5xl font-bold mb-1">${getTotalSalaryEarned().toLocaleString()}</p>
                  <p className="text-primary-foreground/60 text-sm">
                    {salaryPayments.length > 0 ? `${salaryPayments.length} payment${salaryPayments.length > 1 ? 's' : ''} received` : 'No payments yet'}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                  <TrendingUp className="relative h-16 w-16 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Salary Tier */}
          {activeTier && (
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  Active Salary Tier - {activeTier.achievement?.name}
                </CardTitle>
                <CardDescription>
                  You're currently enrolled in the monthly salary program
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Monthly Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      ${activeTier.achievement?.reward_amount}/mo
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Payments Received</p>
                    <p className="text-2xl font-bold">
                      {salaryPayments.filter(p => p.achievement_tier === activeTier.achievement?.name).length}/6
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total from This Tier</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${salaryPayments.filter(p => p.achievement_tier === activeTier.achievement?.name)
                        .reduce((sum, p) => sum + Number(p.amount), 0)}
                    </p>
                  </div>
                </div>

                {/* Payment Timeline */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-4">Payment Schedule (6 months)</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((month) => {
                      const payment = salaryPayments.find(
                        p => p.achievement_tier === activeTier.achievement?.name && p.payment_month === month
                      );
                      const isPaid = !!payment;
                      const isNext = !isPaid && month === (salaryPayments.filter(
                        p => p.achievement_tier === activeTier.achievement?.name
                      ).length + 1);
                      
                      return (
                        <div
                          key={month}
                          className={`
                            p-4 rounded-lg text-center transition-all
                            ${isPaid 
                              ? 'bg-green-500/20 border-2 border-green-500' 
                              : isNext
                              ? 'bg-primary/20 border-2 border-primary animate-pulse'
                              : 'bg-muted border border-border'}
                          `}
                        >
                          <div className="text-xs text-muted-foreground mb-1">Month {month}</div>
                          <div className={`text-lg font-bold ${isPaid ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {isPaid ? <CheckCircle2 className="h-6 w-6 mx-auto" /> : <Clock className="h-6 w-6 mx-auto" />}
                          </div>
                          {isPaid && payment && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(payment.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievement Tiers - Claim Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Achievement Tiers
              </CardTitle>
              <CardDescription>
                Build your team to unlock higher tiers and monthly salaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Team Deposits Progress</span>
                  <span className="text-sm font-semibold">${totalTeamDeposits.toLocaleString()}</span>
                </div>
                <Progress 
                  value={achievements.length > 0 ? (totalTeamDeposits / achievements[achievements.length - 1].milestone_amount) * 100 : 0} 
                  className="h-2"
                />
              </div>

              {/* Achievement Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => {
                  const progress = userProgress.find(p => p.achievement_id === achievement.id);
                  const isUnlocked = totalTeamDeposits >= achievement.milestone_amount;
                  const isClaimed = progress?.is_claimed || false;
                  const canClaim = isUnlocked && !isClaimed && achievement.reward_amount > 0;
                  const progressPercent = (totalTeamDeposits / achievement.milestone_amount) * 100;
                  
                  const IconComponent = getIconComponent(achievement.icon);
                  
                  return (
                    <Card 
                      key={achievement.id} 
                      className={`relative overflow-hidden transition-all ${
                        isUnlocked 
                          ? 'border-2 border-primary shadow-lg' 
                          : 'border border-border'
                      }`}
                    >
                      {isUnlocked && !isClaimed && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl" />
                      )}
                      
                      <CardContent className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${
                              isUnlocked ? 'from-primary to-accent' : 'from-muted to-muted-foreground/20'
                            }`}>
                              <IconComponent className={`h-6 w-6 ${isUnlocked ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{achievement.name}</h3>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            </div>
                          </div>
                          {isClaimed && (
                            <Badge className="bg-green-500">Claimed</Badge>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Required Deposits</span>
                            <span className="font-semibold">${achievement.milestone_amount.toLocaleString()}</span>
                          </div>
                          
                          {achievement.reward_amount > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">One-Time Reward</span>
                              <span className="font-bold text-primary">${achievement.reward_amount}</span>
                            </div>
                          )}

                          {!isUnlocked && (
                            <>
                              <Progress value={Math.min(progressPercent, 100)} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                ${(achievement.milestone_amount - totalTeamDeposits).toLocaleString()} more needed
                              </p>
                            </>
                          )}

                          {canClaim && (
                            <Button 
                              onClick={() => claimTierReward(achievement.id, achievement.name, achievement.reward_amount)}
                              disabled={claimingId === achievement.id}
                              className="w-full mt-2"
                            >
                              {claimingId === achievement.id ? 'Claiming...' : `Claim $${achievement.reward_amount} Reward`}
                            </Button>
                          )}

                          {isUnlocked && isClaimed && (
                            <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Tier unlocked & reward claimed</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Salary Payment History */}
          {salaryPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {salaryPayments.map((payment) => (
                    <div 
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{payment.achievement_tier} - Month {payment.payment_month}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.paid_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${payment.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Salary;
