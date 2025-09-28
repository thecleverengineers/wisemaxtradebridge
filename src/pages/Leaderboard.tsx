
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown, TrendingUp, Users, ArrowLeft, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface LeaderboardUser {
  id: string;
  name: string;
  total_investment: number;
  total_roi_earned: number;
  total_referral_earned: number;
  referral_count: number;
  rank: number;
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

  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab]);

  useEffect(() => {
    // Set up real-time subscription for users table
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        () => {
          // Refetch data when any user data changes
          fetchLeaderboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const fetchLeaderboardData = async () => {
    try {
      let orderBy = '';
      switch (activeTab) {
        case 'investment':
          orderBy = 'total_investment';
          break;
        case 'roi':
          orderBy = 'total_roi_earned';
          break;
        case 'referral':
          orderBy = 'total_referral_earned';
          break;
        default:
          orderBy = 'total_investment';
      }

      // Get top users with referral count
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          total_investment,
          total_roi_earned,
          total_referral_earned
        `)
        .order(orderBy, { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get referral counts for each user
      const leaderboard = await Promise.all(
        usersData.map(async (user, index) => {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', user.id);

          return {
            ...user,
            referral_count: count || 0,
            rank: index + 1
          };
        })
      );

      setLeaderboardData(leaderboard);

      // Find current user's rank
      const currentUserIndex = leaderboard.findIndex(u => u.id === user?.id);
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
    return `₹${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4 animate-bounce" />
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
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
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
                <p className="text-purple-300">Top performers in our community</p>
              </div>
            </div>
          </div>

          {/* User's Current Rank */}
          {userRank && (
            <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Your Current Rank</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-3xl font-bold">#{userRank}</span>
                      <Star className="h-6 w-6 text-yellow-400" />
                    </div>
                  </div>
                  <Trophy className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Tabs */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex space-x-2 overflow-x-auto">
                <Button
                  onClick={() => setActiveTab('investment')}
                  className={`flex-shrink-0 ${
                    activeTab === 'investment'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Investment
                </Button>
                <Button
                  onClick={() => setActiveTab('roi')}
                  className={`flex-shrink-0 ${
                    activeTab === 'roi'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <Award className="h-4 w-4 mr-2" />
                  ROI Earned
                </Button>
                <Button
                  onClick={() => setActiveTab('referral')}
                  className={`flex-shrink-0 ${
                    activeTab === 'referral'
                      ? 'bg-gradient-to-r from-orange-600 to-red-600'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Referrals
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {leaderboardData.slice(0, 3).map((user, index) => (
              <Card key={user.id} className={`${getRankBadge(index + 1)} border-0 text-white`}>
                <CardContent className="p-4 text-center">
                  <div className="mb-2">
                    {getRankIcon(index + 1)}
                  </div>
                  <h3 className="font-semibold truncate">{user.name}</h3>
                  <p className="text-sm opacity-90">
                    {formatValue(
                      activeTab === 'investment' ? user.total_investment :
                      activeTab === 'roi' ? user.total_roi_earned :
                      user.referral_count,
                      activeTab === 'referral' ? 'referral' : 'currency'
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full Leaderboard */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                {activeTab === 'investment' ? 'Top Investors' :
                 activeTab === 'roi' ? 'Top ROI Earners' :
                 'Top Referrers'}
              </CardTitle>
              <CardDescription className="text-purple-300">
                Complete ranking of all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboardData.map((leaderboardUser) => (
                  <div
                    key={leaderboardUser.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                      leaderboardUser.id === user?.id ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10">
                        {leaderboardUser.rank <= 3 ? (
                          getRankIcon(leaderboardUser.rank)
                        ) : (
                          <span className="text-lg font-bold text-purple-300">#{leaderboardUser.rank}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{leaderboardUser.name}</h4>
                        <p className="text-purple-300 text-sm">
                          {leaderboardUser.referral_count} referrals
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        {formatValue(
                          activeTab === 'investment' ? leaderboardUser.total_investment :
                          activeTab === 'roi' ? leaderboardUser.total_roi_earned :
                          leaderboardUser.referral_count,
                          activeTab === 'referral' ? 'referral' : 'currency'
                        )}
                      </p>
                      {activeTab !== 'referral' && (
                        <p className="text-purple-300 text-sm">
                          Total: ₹{(leaderboardUser.total_investment + leaderboardUser.total_roi_earned + leaderboardUser.total_referral_earned).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievement Badges */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Achievement Levels</CardTitle>
              <CardDescription className="text-purple-300">
                Reach these milestones to unlock special badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <Crown className="h-8 w-8 text-yellow-400" />
                    <div>
                      <h4 className="text-white font-semibold">Elite Investor</h4>
                      <p className="text-purple-300 text-sm">₹1,00,000+ invested</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <Trophy className="h-8 w-8 text-gray-400" />
                    <div>
                      <h4 className="text-white font-semibold">Star Performer</h4>
                      <p className="text-purple-300 text-sm">₹50,000+ ROI earned</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <Users className="h-8 w-8 text-orange-400" />
                    <div>
                      <h4 className="text-white font-semibold">Super Referrer</h4>
                      <p className="text-purple-300 text-sm">50+ direct referrals</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <Medal className="h-8 w-8 text-orange-500" />
                    <div>
                      <h4 className="text-white font-semibold">Community Leader</h4>
                      <p className="text-purple-300 text-sm">Top 10 overall</p>
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
