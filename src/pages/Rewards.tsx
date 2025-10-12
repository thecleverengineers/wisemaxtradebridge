
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

const Rewards = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  
  const [activeTab, setActiveTab] = useState('available');
  const [totalRewards, setTotalRewards] = useState(0);

  useEffect(() => {
    if (user) {
      fetchRewards();
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
          description: 'Complete your first investment to get ₹500 bonus',
          type: 'milestone',
          amount: 500,
          requirement: 1,
          current_progress: userInvestments,
          claimed: userInvestments >= 1,
          icon: Gift,
          color: 'from-green-500 to-emerald-600'
        },
        {
          id: '2',
          title: 'Referral Master',
          description: 'Refer 5 friends and earn ₹1000 bonus',
          type: 'achievement',
          amount: 1000,
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
          id: '4',
          title: 'ROI Champion',
          description: 'Earn ₹10,000 in ROI to get ₹1500 bonus',
          type: 'achievement',
          amount: 1500,
          requirement: 10000,
          current_progress: userRoi,
          claimed: userRoi >= 10000,
          icon: Zap,
          color: 'from-purple-500 to-pink-600'
        },
        {
          id: '5',
          title: 'Super Referrer',
          description: 'Refer 20 friends for ₹5000 mega bonus',
          type: 'achievement',
          amount: 5000,
          requirement: 20,
          current_progress: userReferrals,
          claimed: userReferrals >= 20,
          icon: Target,
          color: 'from-red-500 to-pink-600'
        },
        {
          id: '6',
          title: 'Daily Login',
          description: 'Login daily for 30 days - ₹50/day',
          type: 'daily',
          amount: 50,
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
                      <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wide">Level</th>
                      <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wide">Total Team Deposit</th>
                      <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wide">Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold">Level 1</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$5,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$50 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold">Level 2</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$10,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$100 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold">Level 3</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$20,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$200 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold">Level 4</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$90,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$600 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group bg-primary/5">
                      <td className="py-4 px-6">
                        <Badge className="font-semibold bg-gradient-to-r from-primary to-accent">Level 5</Badge>
                      </td>
                      <td className="py-4 px-6 font-bold">$150,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg">$700 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold">Level 6</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$250,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$800 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold">Level 7</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$500,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold">$900 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group bg-accent/5">
                      <td className="py-4 px-6">
                        <Badge className="font-semibold bg-gradient-to-r from-accent to-primary">Level 8</Badge>
                      </td>
                      <td className="py-4 px-6 font-bold">$1,000,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg">$1,000 USDT</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="secondary" className="font-semibold">Level 9</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$1,300,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-yellow-600 dark:text-yellow-400 font-bold">TBD</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors group">
                      <td className="py-4 px-6">
                        <Badge variant="secondary" className="font-semibold">Level 10</Badge>
                      </td>
                      <td className="py-4 px-6 font-medium">$2,000,000 USDT</td>
                      <td className="py-4 px-6">
                        <span className="text-yellow-600 dark:text-yellow-400 font-bold">TBD</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/50 transition-colors bg-muted/30">
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-semibold">Level 11-20</Badge>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground italic">Higher levels available</td>
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
