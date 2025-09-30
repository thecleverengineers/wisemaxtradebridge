import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Copy, Share2, TrendingUp, Gift, ArrowLeft, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface ReferralUser {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  total_investment: number;
}

interface ReferralBonus {
  id: string;
  amount: number;
  level: number;
  bonus_type: string;
  base_amount: number;
  percentage: number;
  created_at: string;
  from_user_id: string;
  users: {
    name: string;
  };
}

interface LevelStats {
  level: number;
  count: number;
  totalEarnings: number;
  totalDeposits: number;
}

const Referrals = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [referralUsers, setReferralUsers] = useState<ReferralUser[]>([]);
  const [referralBonuses, setReferralBonuses] = useState<ReferralBonus[]>([]);
  
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0
  });
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      // Fetch all referrals with referred user info
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('level', { ascending: true })
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Fetch referred users separately
      const referredIds = [...new Set(referralsData?.map(r => r.referred_id) || [])];
      const { data: referredUsersData, error: referredUsersError } = await supabase
        .from('users')
        .select('id, name, email, created_at, is_active, total_investment')
        .in('id', referredIds);

      if (referredUsersError) throw referredUsersError;

      // Create a map of user data
      const userMap = new Map(referredUsersData?.map(u => [u.id, u]) || []);

      // Get level 1 referrals for display
      const level1Referrals = referralsData?.filter(r => r.level === 1)
        .map(r => {
          const user = userMap.get(r.referred_id);
          return user ? {
            id: user.id,
            name: user.name,
            created_at: user.created_at,
            is_active: user.is_active,
            total_investment: user.total_investment
          } : null;
        })
        .filter(Boolean) || [];
      
      setReferralUsers(level1Referrals as ReferralUser[]);

      // Fetch referral bonuses
      const { data: bonusesData, error: bonusesError } = await supabase
        .from('referral_bonus')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bonusesError) throw bonusesError;

      // Get user names for bonuses
      const bonusUserIds = [...new Set(bonusesData?.map(b => b.referral_id).filter(Boolean) || [])];
      const { data: bonusUsersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', bonusUserIds);

      const bonusUserMap = new Map(bonusUsersData?.map(u => [u.id, u]) || []);
      
      // Map bonuses with user info
      const mappedBonuses = (bonusesData || []).map((bonus: any) => ({
        ...bonus,
        from_user_id: bonus.referral_id,
        users: bonusUserMap.get(bonus.referral_id) || { name: 'Unknown' }
      }));
      setReferralBonuses(mappedBonuses);

      // Calculate stats by level
      const levelStats = Array.from({ length: 10 }, (_, i) => i + 1).map(level => {
        const levelReferrals = referralsData?.filter(r => r.level === level) || [];
        const levelBonuses = bonusesData?.filter(b => b.level === level) || [];
        return {
          level,
          count: levelReferrals.length,
          totalEarnings: levelBonuses.reduce((sum, b) => sum + (b.amount || 0), 0),
          totalDeposits: levelReferrals.reduce((sum, r) => sum + (r.total_deposits || 0), 0)
        };
      });

      // Calculate overall stats
      const totalReferrals = referralsData?.length || 0;
      const activeCount = referralsData?.filter(r => {
        const user = userMap.get(r.referred_id);
        return user?.is_active;
      }).length || 0;
      const totalEarnings = bonusesData?.reduce((sum, bonus) => sum + (bonus.amount || 0), 0) || 0;
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthEarnings = bonusesData?.filter(bonus => 
        new Date(bonus.created_at) >= thisMonth
      ).reduce((sum, bonus) => sum + (bonus.amount || 0), 0) || 0;

      setStats({
        totalReferrals,
        activeReferrals: activeCount,
        totalEarnings,
        thisMonthEarnings
      });

      // Store level stats for display
      setLevelStats(levelStats);

    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive",
      });
    }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const shareReferralLink = () => {
    const referralLink = `https://laktoken.in/auth?ref=${profile?.referral_code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join LakToken',
        text: 'Start investing with LakToken and earn guaranteed returns!',
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };


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
                <h1 className="text-2xl font-bold text-white">Referral Program</h1>
                <p className="text-purple-300">Earn rewards by inviting friends</p>
              </div>
            </div>
          </div>

          {/* Referral Code Card */}
          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-black">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Your Referral Code</h2>
                <div className="bg-white/20 rounded-xl p-4 mb-4">
                  <p className="text-3xl font-bold tracking-wider">{profile?.referral_code}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={copyReferralCode}
                    className="bg-white/20 hover:bg-white/30 text-black border-white/30"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button 
                    onClick={shareReferralLink}
                    className="bg-white/20 hover:bg-white/30 text-black border-white/30"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-200" />
                  <p className="text-blue-100 text-sm">Total Referrals</p>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-200" />
                  <p className="text-green-100 text-sm">Active Referrals</p>
                  <p className="text-2xl font-bold">{stats.activeReferrals}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <Gift className="h-8 w-8 mx-auto mb-2 text-purple-200" />
                  <p className="text-purple-100 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-200" />
                  <p className="text-orange-100 text-sm">This Month</p>
                  <p className="text-2xl font-bold">₹{stats.thisMonthEarnings.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Rewards Structure */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Reward Structure</CardTitle>
              <CardDescription className="text-purple-300">
                Earn commissions on 10 levels of referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-3 text-center text-black">
                  <h3 className="font-bold">Level 1</h3>
                  <p className="text-xl font-bold">10%</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl p-3 text-center text-white">
                  <h3 className="font-bold">Level 2</h3>
                  <p className="text-xl font-bold">5%</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-3 text-center text-white">
                  <h3 className="font-bold">Level 3</h3>
                  <p className="text-xl font-bold">3%</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-3 text-center text-white">
                  <h3 className="font-bold">Level 4</h3>
                  <p className="text-xl font-bold">2%</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-xl p-3 text-center text-white">
                  <h3 className="font-bold">Level 5</h3>
                  <p className="text-xl font-bold">1.5%</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl p-3 text-center text-white">
                  <h3 className="font-bold">Level 6</h3>
                  <p className="text-xl font-bold">1%</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl p-3 text-center text-black">
                  <h3 className="font-bold">Level 7</h3>
                  <p className="text-xl font-bold">0.75%</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 text-center text-white">
                  <h3 className="font-bold">Level 8</h3>
                  <p className="text-xl font-bold">0.5%</p>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl p-3 text-center text-white">
                  <h3 className="font-bold">Level 9</h3>
                  <p className="text-xl font-bold">0.25%</p>
                </div>
                <div className="bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl p-3 text-center text-white">
                  <h3 className="font-bold">Level 10</h3>
                  <p className="text-xl font-bold">0.1%</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <p className="text-purple-300 text-sm">
                  <strong className="text-white">How it works:</strong> Earn commissions up to 10 levels deep! When someone uses your referral code and makes an investment, 
                  you earn 10%. Their referrals earn you 5%, and it continues down to level 10 at 0.1%. Build your network and maximize your passive income!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Level-wise Statistics */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Level-wise Performance</CardTitle>
              <CardDescription className="text-purple-300">
                Track your earnings and referrals at each level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {levelStats.length > 0 ? (
                <div className="space-y-3">
                  {levelStats.map((stat) => (
                    stat.count > 0 && (
                      <div key={stat.level} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">L{stat.level}</span>
                            </div>
                            <div>
                              <p className="text-white font-semibold">Level {stat.level}</p>
                              <p className="text-purple-300 text-sm">{stat.count} referral{stat.count !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-semibold">₹{stat.totalEarnings.toLocaleString()}</p>
                            <p className="text-purple-300 text-xs">from ₹{stat.totalDeposits.toLocaleString()} deposits</p>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  {levelStats.every(stat => stat.count === 0) && (
                    <p className="text-purple-300 text-center py-4">No referrals yet. Start building your network!</p>
                  )}
                </div>
              ) : (
                <p className="text-purple-300 text-center py-4">Building level statistics...</p>
              )}
            </CardContent>
          </Card>

          {/* My Referrals */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">My Referrals</CardTitle>
              <CardDescription className="text-purple-300">
                People who joined using your referral code
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-purple-300">No referrals yet. Start sharing your code to earn rewards!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referralUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{user.name}</p>
                          <p className="text-purple-300 text-sm">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${user.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <p className="text-purple-300 text-sm mt-1">
                          Invested: ₹{user.total_investment?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referral Earnings */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Referral Earnings</CardTitle>
              <CardDescription className="text-purple-300">
                Your commission history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralBonuses.length === 0 ? (
                <p className="text-purple-300 text-center py-8">No earnings yet. Start referring to see your commissions here!</p>
              ) : (
                <div className="space-y-3">
                  {referralBonuses.slice(0, 10).map((bonus) => (
                    <div key={bonus.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-semibold">Level {bonus.level} Commission</p>
                        <p className="text-purple-300 text-sm">
                          From: {bonus.users?.name} • {bonus.percentage}% of ₹{bonus.base_amount?.toLocaleString()}
                        </p>
                        <p className="text-purple-300 text-sm">
                          {new Date(bonus.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold text-lg">+₹{bonus.amount?.toLocaleString()}</p>
                        <Badge className="bg-yellow-500 text-black text-xs">
                          {bonus.bonus_type}
                        </Badge>
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
    </div>
  );
};

export default Referrals;
