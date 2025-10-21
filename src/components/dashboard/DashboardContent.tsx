
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, Wallet, Eye, Copy, Check, DollarSign, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface WalletData {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  locked_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  roi_income: number;
  referral_income: number;
  bonus_income: number;
  level_income: number;
  total_balance: number;
  wallet_address?: string;
  network?: string;
  last_transaction_at?: string;
  created_at: string;
  updated_at: string;
}

interface InvestmentPlan {
  id: string;
  name: string;
  description?: string;
  min_amount: number;
  max_amount: number;
  daily_roi: number;
  duration_days: number;
  total_return_percent: number;
  status?: string;
  created_at?: string;
}

export const DashboardContent = () => {
  const { profile, user, isAdmin } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([]);
  const [copied, setCopied] = useState(false);
  const [totalSalary, setTotalSalary] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch wallet data
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (walletError) throw walletError;
      
      if (walletData) {
        // Add total_balance calculation
        const walletWithTotal = {
          ...walletData,
          total_balance: walletData.balance + walletData.roi_income + walletData.referral_income + walletData.bonus_income + walletData.level_income
        };
        setWallet(walletWithTotal);
      }

      // Fetch total salary payments
      const { data: salaryData, error: salaryError } = await supabase
        .from('salary_payments')
        .select('amount')
        .eq('user_id', user?.id);

      if (!salaryError && salaryData) {
        const total = salaryData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        setTotalSalary(total);
      }

      // Fetch total rewards (from referral bonuses)
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('referral_bonuses')
        .select('amount')
        .eq('user_id', user?.id);

      if (!rewardsError && rewardsData) {
        const total = rewardsData.reduce((sum, bonus) => sum + (bonus.amount || 0), 0);
        setTotalRewards(total);
      }

      // Fetch investment plans
      const { data: plansData, error: plansError } = await supabase
        .from('investment_plans')
        .select('*')
        .order('min_amount');

      if (plansError) throw plansError;
      setInvestmentPlans(plansData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const copyReferralCode = async () => {
    if (profile?.referral_code) {
      await navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${profile?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copied!",
      description: "Share this link with your friends to earn rewards",
    });
  };

  return (
    <div className="flex-1 p-4 pt-20 pb-20 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back!</h2>
            <p className="text-muted-foreground mt-1">{profile?.name}</p>
            {isAdmin && (
              <Badge variant="secondary" className="mt-2">
                Admin Access
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-sm">Total Balance</p>
            <p className="text-3xl font-bold">₹{wallet?.total_balance?.toLocaleString() || '0'}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">ROI Income</p>
                <p className="text-2xl font-bold">₹{wallet?.roi_income?.toLocaleString() || '0'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Salary</p>
                <p className="text-2xl font-bold">₹{totalSalary?.toLocaleString() || '0'}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Rewards</p>
                <p className="text-2xl font-bold">₹{totalRewards?.toLocaleString() || '0'}</p>
              </div>
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Referral Income</p>
                <p className="text-2xl font-bold">₹{wallet?.referral_income?.toLocaleString() || '0'}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Level Income</p>
                <p className="text-2xl font-bold">₹{wallet?.level_income?.toLocaleString() || '0'}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Bonus Income</p>
                <p className="text-2xl font-bold">₹{wallet?.bonus_income?.toLocaleString() || '0'}</p>
              </div>
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Plans */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Investment Plans
          </CardTitle>
          <CardDescription>
            Choose from our premium investment options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {investmentPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-accent/30 rounded-xl p-4 border border-border/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <Badge>
                  {plan.daily_roi}% Daily
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-muted-foreground text-sm">Min Amount</p>
                  <p className="font-semibold">₹{plan.min_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Duration</p>
                  <p className="font-semibold">{plan.duration_days} Days</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Max Amount</p>
                  <p className="font-semibold">₹{plan.max_amount?.toLocaleString() || 'No Limit'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Return</p>
                  <p className="font-semibold">{plan.total_return_percent}%</p>
                </div>
              </div>
              
              <Button className="w-full">
                Invest Now
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Referral Section */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Referral Program
          </CardTitle>
          <CardDescription>
            Share your referral code and earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="font-medium mb-2 text-center">Your Referral Code</p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <p className="text-3xl font-bold tracking-wider">{profile?.referral_code}</p>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={copyReferralCode}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={shareReferralLink}
              >
                Share Link
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={copyReferralCode}
              >
                Copy Code
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Earn rewards when friends sign up with your code!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
