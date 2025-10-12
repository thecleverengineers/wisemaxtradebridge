
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, Star, Crown, Zap, Target, Award, ArrowLeft, Calendar } from 'lucide-react';
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
        const session = await supabase.auth.getSession();
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const [achievementsRes, progressRes, depositsRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/team_achievements?order=milestone_amount.asc`, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${session.data.session?.access_token}`
            }
          }),
          fetch(`${SUPABASE_URL}/rest/v1/user_achievement_progress?user_id=eq.${user?.id}`, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${session.data.session?.access_token}`
            }
          }),
          fetch(`${SUPABASE_URL}/rest/v1/rpc/calculate_team_deposits`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${session.data.session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ referrer_user_id: user?.id })
          })
        ]);

        teamAchievementsData = await achievementsRes.json();
        userProgressData = await progressRes.json();
        totalTeamDeposits = Number(await depositsRes.text()) || 0;
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
      case 'progress':
        return rewards.filter(r => !r.claimed && r.current_progress < r.requirement);
      case 'claimed':
        return rewards.filter(r => r.claimed);
      default:
        return rewards;
    }
  };


  return (
    <div className="min-h-screen bg-background">
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
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Rewards Center</h1>
                <p className="text-muted-foreground">Earn bonuses and unlock achievements</p>
              </div>
            </div>
          </div>

          {/* Total Rewards Earned */}
          <Card className="bg-gradient-to-r from-primary via-accent to-primary border-0 text-primary-foreground shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm">Total Rewards Earned</p>
                  <p className="text-4xl font-bold">₹{totalRewards.toLocaleString()}</p>
                </div>
                <Award className="h-12 w-12 text-primary-foreground/80" />
              </div>
            </CardContent>
          </Card>

          {/* Category Tabs */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-2 overflow-x-auto">
                <Button
                  onClick={() => setActiveTab('available')}
                  variant={activeTab === 'available' ? 'default' : 'outline'}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Available ({rewards.filter(r => !r.claimed && r.current_progress >= r.requirement).length})
                </Button>
                <Button
                  onClick={() => setActiveTab('progress')}
                  variant={activeTab === 'progress' ? 'default' : 'outline'}
                >
                  <Target className="h-4 w-4 mr-2" />
                  In Progress ({rewards.filter(r => !r.claimed && r.current_progress < r.requirement).length})
                </Button>
                <Button
                  onClick={() => setActiveTab('claimed')}
                  variant={activeTab === 'claimed' ? 'default' : 'outline'}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Claimed ({rewards.filter(r => r.claimed).length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rewards List */}
          <div className="space-y-4">
            {getFilteredRewards().map((reward) => (
              <Card key={reward.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${reward.color}`}>
                        <reward.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{reward.title}</h3>
                          <Badge variant={
                            reward.type === 'daily' ? 'default' :
                            reward.type === 'milestone' ? 'default' :
                            reward.type === 'achievement' ? 'default' :
                            'secondary'
                          }>
                            {reward.type}
                          </Badge>
                        </div>
                        <p className="text-purple-300 text-sm mb-3">{reward.description}</p>
                        
                        {!reward.claimed && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-300">Progress</span>
                              <span className="text-white">
                                {Math.min(reward.current_progress, reward.requirement)}/{reward.requirement}
                              </span>
                            </div>
                            <Progress 
                              value={(reward.current_progress / reward.requirement) * 100} 
                              className="h-2 bg-white/10"
                            />
                          </div>
                        )}
                        
                        {reward.claimed && (
                          <Badge className="bg-green-500 text-white">
                            <Award className="h-3 w-3 mr-1" />
                            Claimed
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white mb-2">₹{reward.amount}</p>
                      {!reward.claimed && reward.current_progress >= reward.requirement && (
                        <Button
                          onClick={() => claimReward(reward.id)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          Claim Now
                        </Button>
                      )}
                      {!reward.claimed && reward.current_progress < reward.requirement && (
                        <p className="text-purple-300 text-sm">
                          {reward.requirement - reward.current_progress} more needed
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {getFilteredRewards().length === 0 && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <Gift className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">No Rewards Found</h3>
                <p className="text-purple-300">
                  {activeTab === 'available' && "No rewards are ready to claim right now."}
                  {activeTab === 'progress' && "All rewards are either completed or claimed."}
                  {activeTab === 'claimed' && "You haven't claimed any rewards yet."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Reward Tips */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">How to Earn More Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-purple-300 text-sm">
                <div>
                  <h4 className="text-white font-semibold mb-2">💰 Make Investments</h4>
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
