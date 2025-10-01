
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, Wallet, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
        .single();

      if (walletError) throw walletError;
      
      // Add total_balance calculation
      const walletWithTotal = {
        ...walletData,
        total_balance: walletData.balance + walletData.roi_income + walletData.referral_income + walletData.bonus_income + walletData.level_income
      };
      setWallet(walletWithTotal);

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


  return (
    <div className="flex-1 p-4 pt-20 pb-20 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back!</h2>
            <p className="text-blue-100 mt-1">{profile?.name}</p>
            {isAdmin && (
              <Badge className="mt-2 bg-yellow-500 text-black">
                Admin Access
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Total Balance</p>
            <p className="text-3xl font-bold">₹{wallet?.total_balance?.toLocaleString() || '0'}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">ROI Income</p>
                <p className="text-2xl font-bold">₹{wallet?.roi_income?.toLocaleString() || '0'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Referral Income</p>
                <p className="text-2xl font-bold">₹{wallet?.referral_income?.toLocaleString() || '0'}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Level Income</p>
                <p className="text-2xl font-bold">₹{wallet?.level_income?.toLocaleString() || '0'}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Bonus Income</p>
                <p className="text-2xl font-bold">₹{wallet?.bonus_income?.toLocaleString() || '0'}</p>
              </div>
              <Wallet className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Plans */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Investment Plans
          </CardTitle>
          <CardDescription className="text-purple-300">
            Choose from our premium investment options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {investmentPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-lg">{plan.name}</h3>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  {plan.daily_roi}% Daily
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-purple-300 text-sm">Min Amount</p>
                  <p className="text-white font-semibold">₹{plan.min_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-purple-300 text-sm">Duration</p>
                  <p className="text-white font-semibold">{plan.duration_days} Days</p>
                </div>
                <div>
                  <p className="text-purple-300 text-sm">Max Amount</p>
                  <p className="text-white font-semibold">₹{plan.max_amount?.toLocaleString() || 'No Limit'}</p>
                </div>
                <div>
                  <p className="text-purple-300 text-sm">Total Return</p>
                  <p className="text-white font-semibold">{plan.total_return_percent}%</p>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Invest Now
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Referral Section */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Referral Program
          </CardTitle>
          <CardDescription className="text-purple-300">
            Share your referral code and earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-center">
            <p className="text-black font-medium mb-2">Your Referral Code</p>
            <p className="text-black text-2xl font-bold tracking-wider">{profile?.referral_code}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 bg-white/20 border-white/30 text-black hover:bg-white/30"
            >
              Share Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
