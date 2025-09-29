import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown, TrendingUp, Users, ArrowLeft, Star, Gem, Shield, Zap, Target, Rocket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaderboardUser {
  id: string;
  name: string;
  total_investment: number;
  total_roi_earned: number;
  total_referral_earned: number;
  referral_count: number;
  rank: number;
  achievement_level?: string;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('investment');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab]);

  useEffect(() => {
    // Set up real-time subscriptions for multiple tables
    const subscriptionChannel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        () => {
          fetchLeaderboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roi_investments'
        },
        () => {
          fetchLeaderboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals'
        },
        () => {
          fetchLeaderboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments'
        },
        () => {
          fetchLeaderboardData();
        }
      )
      .subscribe();

    setChannel(subscriptionChannel);

    return () => {
      if (subscriptionChannel) {
        supabase.removeChannel(subscriptionChannel);
      }
    };
  }, [activeTab]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Get all users with their stats
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          total_investment,
          total_roi_earned,
          total_referral_earned
        `)
        .order('total_investment', { ascending: false });

      if (usersError) throw usersError;

      // Get referral counts for each user
      const leaderboard = await Promise.all(
        (usersData || []).map(async (userData) => {
          // Count direct referrals
          const { count: directReferrals } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', userData.id);

          // Count total referrals across all levels
          const { count: totalReferrals } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', userData.id);

          const achievementLevel = getAchievementLevel(
            userData.total_investment,
            userData.total_roi_earned,
            directReferrals || 0
          );

          return {
            ...userData,
            referral_count: directReferrals || 0,
            total_referrals: totalReferrals || 0,
            achievement_level: achievementLevel
          };
        })
      );

      // Sort based on active tab
      let sortedData = [...leaderboard];
      switch (activeTab) {
        case 'investment':
          sortedData.sort((a, b) => b.total_investment - a.total_investment);
          break;
        case 'roi':
          sortedData.sort((a, b) => b.total_roi_earned - a.total_roi_earned);
          break;
        case 'referral':
          sortedData.sort((a, b) => b.total_referral_earned - a.total_referral_earned);
          break;
      }

      // Add ranks
      const rankedData = sortedData.map((userData, index) => ({
        ...userData,
        rank: index + 1
      }));

      setLeaderboardData(rankedData);

      // Find current user's rank
      const currentUserIndex = rankedData.findIndex(u => u.id === user?.id);
      setUserRank(currentUserIndex >= 0 ? currentUserIndex + 1 : null);

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAchievementLevel = (investment: number, roi: number, referrals: number): string => {
    if (investment >= 1000000 || roi >= 500000 || referrals >= 100) {
      return 'Diamond Elite';
    } else if (investment >= 500000 || roi >= 250000 || referrals >= 75) {
      return 'Platinum';
    } else if (investment >= 250000 || roi >= 100000 || referrals >= 50) {
      return 'Gold';
    } else if (investment >= 100000 || roi >= 50000 || referrals >= 25) {
      return 'Silver';
    } else if (investment >= 50000 || roi >= 25000 || referrals >= 10) {
      return 'Bronze';
    }
    return 'Member';
  };

  const getAchievementIcon = (level: string) => {
    switch (level) {
      case 'Diamond Elite':
        return <Gem className="h-5 w-5 text-cyan-400" />;
      case 'Platinum':
        return <Crown className="h-5 w-5 text-purple-400" />;
      case 'Gold':
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 'Silver':
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 'Bronze':
        return <Shield className="h-5 w-5 text-orange-400" />;
      default:
        return <Star className="h-5 w-5 text-blue-400" />;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-400" />;
      default:
        return <span className="text-2xl font-bold text-purple-300">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-orange-500";
    if (rank === 2) return "bg-gradient-to-r from-gray-400 to-gray-600";
    if (rank === 3) return "bg-gradient-to-r from-orange-400 to-red-500";
    return "bg-gradient-to-r from-purple-500 to-blue-500";
  };

  const formatValue = (value: number, type: string) => {
    if (type === 'referral') return value.toString();
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-center">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce" />
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-foreground hover:bg-accent"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Global Leaderboard</h1>
                <p className="text-muted-foreground">Top performers in our community</p>
              </div>
            </div>
          </div>

          {/* User's Current Rank */}
          {userRank && (
            <Card className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 border-0 text-primary-foreground">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/80 text-sm">Your Current Rank</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl font-bold">#{userRank}</span>
                      <Badge className="bg-primary-foreground/20">
                        {leaderboardData.find(u => u.id === user?.id)?.achievement_level || 'Member'}
                      </Badge>
                    </div>
                  </div>
                  {getAchievementIcon(leaderboardData.find(u => u.id === user?.id)?.achievement_level || 'Member')}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-background/50">
              <TabsTrigger value="investment" className="data-[state=active]:bg-primary">
                <TrendingUp className="h-4 w-4 mr-2" />
                Top Investors
              </TabsTrigger>
              <TabsTrigger value="roi" className="data-[state=active]:bg-primary">
                <Award className="h-4 w-4 mr-2" />
                ROI Earners
              </TabsTrigger>
              <TabsTrigger value="referral" className="data-[state=active]:bg-primary">
                <Users className="h-4 w-4 mr-2" />
                Top Referrers
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6 space-y-6">
              {/* Top 3 Podium */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaderboardData.slice(0, 3).map((user, index) => (
                  <Card key={user.id} className={`${getRankBadge(index + 1)} border-0 text-white transform hover:scale-105 transition-transform`}>
                    <CardContent className="p-6 text-center">
                      <div className="mb-3">
                        {getRankIcon(index + 1)}
                      </div>
                      <h3 className="font-bold text-lg mb-1">{user.name}</h3>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {getAchievementIcon(user.achievement_level || 'Member')}
                        <Badge variant="secondary" className="bg-white/20">
                          {user.achievement_level}
                        </Badge>
                      </div>
                      <p className="text-xl font-semibold">
                        {formatValue(
                          activeTab === 'investment' ? user.total_investment :
                          activeTab === 'roi' ? user.total_roi_earned :
                          user.total_referral_earned,
                          activeTab === 'referral' ? 'currency' : 'currency'
                        )}
                      </p>
                      {activeTab === 'referral' && (
                        <p className="text-sm opacity-90 mt-1">
                          {user.referral_count} direct referrals
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Full Leaderboard */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-primary" />
                    Complete Rankings
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {activeTab === 'investment' ? 'Ranked by total investment amount' :
                     activeTab === 'roi' ? 'Ranked by total ROI earned' :
                     'Ranked by referral earnings'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboardData.map((leaderboardUser) => (
                      <div
                        key={leaderboardUser.id}
                        className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                          leaderboardUser.id === user?.id 
                            ? 'bg-primary/10 border-2 border-primary' 
                            : 'bg-background/50 hover:bg-accent/50 border border-border'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-12">
                            {leaderboardUser.rank <= 3 ? (
                              getRankIcon(leaderboardUser.rank)
                            ) : (
                              <span className="text-lg font-bold text-muted-foreground">
                                #{leaderboardUser.rank}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-foreground font-semibold">{leaderboardUser.name}</h4>
                              {getAchievementIcon(leaderboardUser.achievement_level || 'Member')}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Investment: ${leaderboardUser.total_investment.toLocaleString()}</span>
                              <span>ROI: ${leaderboardUser.total_roi_earned.toLocaleString()}</span>
                              <span>{leaderboardUser.referral_count} referrals</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-foreground">
                            {formatValue(
                              activeTab === 'investment' ? leaderboardUser.total_investment :
                              activeTab === 'roi' ? leaderboardUser.total_roi_earned :
                              leaderboardUser.total_referral_earned,
                              'currency'
                            )}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {leaderboardUser.achievement_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Achievement Levels */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Award className="h-5 w-5 mr-2 text-primary" />
                Achievement Levels
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Reach these milestones to unlock special badges and recognition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                    <Gem className="h-10 w-10 text-cyan-400" />
                    <div>
                      <h4 className="text-foreground font-bold">Diamond Elite</h4>
                      <p className="text-muted-foreground text-sm">$1M+ invested or $500K+ ROI</p>
                      <p className="text-muted-foreground text-xs">100+ referrals</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                    <Crown className="h-10 w-10 text-purple-400" />
                    <div>
                      <h4 className="text-foreground font-bold">Platinum</h4>
                      <p className="text-muted-foreground text-sm">$500K+ invested or $250K+ ROI</p>
                      <p className="text-muted-foreground text-xs">75+ referrals</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                    <Trophy className="h-10 w-10 text-yellow-400" />
                    <div>
                      <h4 className="text-foreground font-bold">Gold</h4>
                      <p className="text-muted-foreground text-sm">$250K+ invested or $100K+ ROI</p>
                      <p className="text-muted-foreground text-xs">50+ referrals</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-lg border border-gray-500/20">
                    <Medal className="h-10 w-10 text-gray-400" />
                    <div>
                      <h4 className="text-foreground font-bold">Silver</h4>
                      <p className="text-muted-foreground text-sm">$100K+ invested or $50K+ ROI</p>
                      <p className="text-muted-foreground text-xs">25+ referrals</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                    <Shield className="h-10 w-10 text-orange-400" />
                    <div>
                      <h4 className="text-foreground font-bold">Bronze</h4>
                      <p className="text-muted-foreground text-sm">$50K+ invested or $25K+ ROI</p>
                      <p className="text-muted-foreground text-xs">10+ referrals</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-500/20">
                    <Star className="h-10 w-10 text-blue-400" />
                    <div>
                      <h4 className="text-foreground font-bold">Member</h4>
                      <p className="text-muted-foreground text-sm">Starting level</p>
                      <p className="text-muted-foreground text-xs">Begin your journey</p>
                    </div>
                  </div>
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

export default Leaderboard;