import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Copy, Share2, TrendingUp, Gift, ArrowLeft, Crown, DollarSign, Network, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { cn } from '@/lib/utils';

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

// 20 Level Matrix Commission Structure
const COMMISSION_RATES = [
  { level: 1, rate: 5.0, color: 'from-yellow-500 to-orange-500' },
  { level: 2, rate: 2.5, color: 'from-blue-500 to-indigo-500' },
  { level: 3, rate: 1.5, color: 'from-purple-500 to-pink-500' },
  { level: 4, rate: 1.0, color: 'from-green-500 to-teal-500' },
  { level: 5, rate: 0.8, color: 'from-red-500 to-rose-500' },
  { level: 6, rate: 0.6, color: 'from-cyan-500 to-blue-500' },
  { level: 7, rate: 0.5, color: 'from-amber-500 to-yellow-600' },
  { level: 8, rate: 0.4, color: 'from-indigo-500 to-purple-600' },
  { level: 9, rate: 0.3, color: 'from-pink-500 to-purple-500' },
  { level: 10, rate: 0.25, color: 'from-gray-500 to-slate-600' },
  { level: 11, rate: 0.2, color: 'from-emerald-500 to-green-600' },
  { level: 12, rate: 0.15, color: 'from-violet-500 to-purple-600' },
  { level: 13, rate: 0.12, color: 'from-orange-500 to-red-600' },
  { level: 14, rate: 0.1, color: 'from-teal-500 to-cyan-600' },
  { level: 15, rate: 0.08, color: 'from-fuchsia-500 to-pink-600' },
  { level: 16, rate: 0.06, color: 'from-lime-500 to-green-600' },
  { level: 17, rate: 0.05, color: 'from-sky-500 to-blue-600' },
  { level: 18, rate: 0.04, color: 'from-rose-500 to-pink-600' },
  { level: 19, rate: 0.03, color: 'from-indigo-400 to-blue-500' },
  { level: 20, rate: 0.02, color: 'from-purple-400 to-indigo-500' },
];

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
    thisMonthEarnings: 0,
    todayEarnings: 0,
    totalTeamSize: 0
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

      // Calculate stats by level (for 20 levels)
      const levelStats = Array.from({ length: 20 }, (_, i) => i + 1).map(level => {
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEarnings = bonusesData?.filter(bonus => 
        new Date(bonus.created_at) >= today
      ).reduce((sum, bonus) => sum + (bonus.amount || 0), 0) || 0;

      setStats({
        totalReferrals,
        activeReferrals: activeCount,
        totalEarnings,
        thisMonthEarnings,
        todayEarnings,
        totalTeamSize: referralsData?.length || 0
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

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${profile?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${profile?.referral_code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join WiseMax Trade Bridge',
        text: 'Start investing with WiseMax and earn guaranteed returns!',
        url: referralLink,
      });
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background"></div>
      
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-foreground hover:bg-primary/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">20 Level Matrix Plan</h1>
                <p className="text-muted-foreground">Earn commissions from your network's investments</p>
              </div>
            </div>
          </div>

          {/* Referral Code Card - Main Focus */}
          <Card className="bg-gradient-to-r from-primary to-accent border-0 text-primary-foreground shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <CardContent className="p-8 relative z-10">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Network className="h-8 w-8" />
                    Your Referral Code
                  </h2>
                  <p className="text-primary-foreground/90">Share this code to grow your network</p>
                </div>
                
                <div className="bg-background/30 backdrop-blur rounded-2xl p-6 border border-background/40">
                  <p className="text-5xl font-bold tracking-wider mb-2">{profile?.referral_code}</p>
                  <p className="text-sm text-primary-foreground/80">Your unique 8-digit code</p>
                </div>
                
                <div className="bg-background/20 backdrop-blur rounded-xl p-4 border border-background/30">
                  <p className="text-sm mb-2 font-semibold">Share Your Referral Link:</p>
                  <div className="bg-background/20 rounded-lg p-3 mb-3">
                    <p className="text-sm break-all font-mono text-primary-foreground/90">
                      {window.location.origin}/auth?ref={profile?.referral_code}
                    </p>
                  </div>
                  <p className="text-xs text-primary-foreground/70">
                    New users can register directly using this link
                  </p>
                </div>
                
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button 
                    onClick={copyReferralCode}
                    size="lg"
                    className="bg-background/30 hover:bg-background/40 text-primary-foreground border border-background/40 backdrop-blur"
                  >
                    <Copy className="h-5 w-5 mr-2" />
                    Copy Code
                  </Button>
                  <Button 
                    onClick={copyReferralLink}
                    size="lg"
                    className="bg-background/30 hover:bg-background/40 text-primary-foreground border border-background/40 backdrop-blur"
                  >
                    <Copy className="h-5 w-5 mr-2" />
                    Copy Link
                  </Button>
                  <Button 
                    onClick={shareReferralLink}
                    size="lg"
                    className="bg-background/30 hover:bg-background/40 text-primary-foreground border border-background/40 backdrop-blur"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Share Now
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-background/30">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                    <p className="text-sm text-primary-foreground/80">Total Referrals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                    <p className="text-sm text-primary-foreground/80">Total Earned</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-200" />
                  <p className="text-blue-100 text-xs">Total Team</p>
                  <p className="text-2xl font-bold">{stats.totalTeamSize}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-200" />
                  <p className="text-green-100 text-xs">Active</p>
                  <p className="text-2xl font-bold">{stats.activeReferrals}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-200" />
                  <p className="text-purple-100 text-xs">Total Earned</p>
                  <p className="text-xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-200" />
                  <p className="text-orange-100 text-xs">This Month</p>
                  <p className="text-xl font-bold">${stats.thisMonthEarnings.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <Gift className="h-8 w-8 mx-auto mb-2 text-cyan-200" />
                  <p className="text-cyan-100 text-xs">Today</p>
                  <p className="text-xl font-bold">${stats.todayEarnings.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500 to-yellow-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <Layers className="h-8 w-8 mx-auto mb-2 text-amber-200" />
                  <p className="text-amber-100 text-xs">Active Levels</p>
                  <p className="text-2xl font-bold">{levelStats.filter(l => l.count > 0).length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Different Views */}
          <Tabs defaultValue="matrix" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="matrix">Matrix Structure</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="team">My Team</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
            </TabsList>

            {/* Matrix Structure Tab */}
            <TabsContent value="matrix" className="space-y-4">
              <Card className="bg-card/80 backdrop-blur border-primary/20">
                <CardHeader>
                  <CardTitle className="text-foreground">20 Level Matrix Commission Structure</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Earn commissions up to 20 levels deep from your team's investments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {COMMISSION_RATES.map((rate) => (
                        <div
                          key={rate.level}
                          className={cn(
                            "bg-gradient-to-br rounded-xl p-4 text-center text-white shadow-lg transition-transform hover:scale-105",
                            rate.color
                          )}
                        >
                          <h3 className="font-bold text-sm">Level {rate.level}</h3>
                          <p className="text-2xl font-bold">{rate.rate}%</p>
                          {levelStats[rate.level - 1]?.count > 0 && (
                            <div className="mt-2 text-xs bg-white/20 rounded p-1">
                              <p>{levelStats[rate.level - 1].count} members</p>
                              <p className="font-bold">${levelStats[rate.level - 1].totalEarnings.toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                    <p className="text-muted-foreground text-sm">
                      <strong className="text-foreground">How it works:</strong> When someone joins using your referral code and makes an investment, 
                      you earn 5% commission. Their referrals earn you 2.5% (Level 2), and it continues down to Level 20 at 0.02%. 
                      Build your network strategically to maximize passive income across all 20 levels!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <Card className="bg-card/80 backdrop-blur border-primary/20">
                <CardHeader>
                  <CardTitle className="text-foreground">Level-wise Performance</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Track your earnings and team growth at each level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {levelStats.map((stat) => (
                        <div 
                          key={stat.level} 
                          className={cn(
                            "p-4 rounded-lg transition-all",
                            stat.count > 0 
                              ? "bg-primary/10 border border-primary/20" 
                              : "bg-muted/10 border border-muted/20 opacity-60"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center",
                                stat.count > 0 
                                  ? `bg-gradient-to-br ${COMMISSION_RATES[stat.level - 1].color}` 
                                  : "bg-muted/20"
                              )}>
                                <span className="text-white font-bold">L{stat.level}</span>
                              </div>
                              <div>
                                <p className="text-foreground font-semibold">Level {stat.level}</p>
                                <p className="text-muted-foreground text-sm">
                                  {stat.count} member{stat.count !== 1 ? 's' : ''} • {COMMISSION_RATES[stat.level - 1].rate}% commission
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "font-bold text-lg",
                                stat.totalEarnings > 0 ? "text-green-500" : "text-muted-foreground"
                              )}>
                                ${stat.totalEarnings.toFixed(2)}
                              </p>
                              {stat.totalDeposits > 0 && (
                                <p className="text-muted-foreground text-xs">
                                  from ${stat.totalDeposits.toFixed(2)} deposits
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-4">
              <Card className="bg-card/80 backdrop-blur border-primary/20">
                <CardHeader>
                  <CardTitle className="text-foreground">Direct Referrals (Level 1)</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    People who joined directly using your referral code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {referralUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No direct referrals yet. Start sharing your code!</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3 pr-4">
                        {referralUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{user.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Joined {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={user.is_active ? "default" : "secondary"}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              {user.total_investment > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Invested: ${user.total_investment.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className="space-y-4">
              <Card className="bg-card/80 backdrop-blur border-primary/20">
                <CardHeader>
                  <CardTitle className="text-foreground">Recent Earnings</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Your latest commission earnings from the matrix
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {referralBonuses.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No earnings yet. Your commissions will appear here.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3 pr-4">
                        {referralBonuses.slice(0, 50).map((bonus) => (
                          <div key={bonus.id} className="flex items-center justify-between p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  Level {bonus.level} Commission
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  From: {bonus.users.name} • {bonus.percentage}% of ${bonus.base_amount?.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(bonus.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-green-500 font-bold text-lg">
                                +${bonus.amount.toFixed(2)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {bonus.bonus_type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
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

export default Referrals;