
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Users, 
  ArrowLeft,
  Wallet,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface InvestmentPlan {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  duration_days: number;
  daily_roi: number;
  total_return_percent: number;
  description: string;
  is_active: boolean;
}

interface WalletData {
  total_balance: number;
  roi_income: number;
  referral_income: number;
  bonus_income: number;
  level_income: number;
  total_withdrawn: number;
}

const Invest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchWalletData();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load investment plans",
        variant: "destructive",
      });
    }
  };

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setWalletData(data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    if (!selectedPlan || !investmentAmount || !walletData) return;

    const amount = parseFloat(investmentAmount);
    
    // Validate investment amount
    if (amount < selectedPlan.min_amount) {
      toast({
        title: "Invalid Amount",
        description: `Minimum investment amount is ₹${selectedPlan.min_amount.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    if (selectedPlan.max_amount && amount > selectedPlan.max_amount) {
      toast({
        title: "Invalid Amount",
        description: `Maximum investment amount is ₹${selectedPlan.max_amount.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    // Check wallet balance
    if (amount > walletData.total_balance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${amount.toLocaleString()} but only have ₹${walletData.total_balance.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    setInvesting(true);
    try {
      // Calculate investment details
      const dailyRoiAmount = (amount * selectedPlan.daily_roi) / 100;
      const totalRoiExpected = (amount * selectedPlan.total_return_percent) / 100;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

      // Create investment record
      const { data: investmentData, error: investmentError } = await supabase
        .from('investments')
        .insert({
          user_id: user?.id,
          plan_id: selectedPlan.id,
          amount: amount,
          daily_roi_amount: dailyRoiAmount,
          total_roi_expected: totalRoiExpected,
          end_date: endDate.toISOString().split('T')[0],
          status: 'active'
        })
        .select()
        .single();

      if (investmentError) throw investmentError;

      // Update wallet balance
      const newBalance = walletData.total_balance - amount;
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          total_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (walletError) throw walletError;

      // Create wallet transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user?.id,
          type: 'debit',
          income_type: 'manual',
          amount: amount,
          balance_before: walletData.total_balance,
          balance_after: newBalance,
          reason: `Investment in ${selectedPlan.name}`,
          reference_id: investmentData.id
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Investment Successful",
        description: `Successfully invested ₹${amount.toLocaleString()} in ${selectedPlan.name}`,
      });

      setInvestmentAmount('');
      setSelectedPlan(null);
      fetchWalletData();
    } catch (error) {
      console.error('Error creating investment:', error);
      toast({
        title: "Investment Failed",
        description: "Failed to create investment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInvesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p>Loading investment plans...</p>
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
                <h1 className="text-2xl font-bold text-white">Investment Plans</h1>
                <p className="text-purple-300">Choose your investment plan and start earning</p>
              </div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          {walletData && (
            <Card className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Wallet className="h-8 w-8" />
                    <div>
                      <p className="text-green-100">Available Balance</p>
                      <p className="text-3xl font-bold">₹{walletData.total_balance.toLocaleString()}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/wallet')}
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    Add Funds
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Investment Plans */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    {plan.name}
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                      {plan.total_return_percent}% ROI
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-purple-300">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-purple-300">Min Investment</p>
                      <p className="text-white font-semibold">₹{plan.min_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-purple-300">Max Investment</p>
                      <p className="text-white font-semibold">
                        {plan.max_amount ? `₹${plan.max_amount.toLocaleString()}` : 'No Limit'}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-300">Daily ROI</p>
                      <p className="text-white font-semibold">{plan.daily_roi}%</p>
                    </div>
                    <div>
                      <p className="text-purple-300">Duration</p>
                      <p className="text-white font-semibold">{plan.duration_days} days</p>
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Invest Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-white">Invest in {plan.name}</DialogTitle>
                        <DialogDescription className="text-purple-300">
                          Enter the amount you want to invest
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount" className="text-white">Investment Amount (₹)</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder={`Min: ₹${plan.min_amount.toLocaleString()}`}
                            value={investmentAmount}
                            onChange={(e) => setInvestmentAmount(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        
                        {investmentAmount && (
                          <div className="bg-white/5 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-300">Investment Amount:</span>
                              <span className="text-white">₹{parseFloat(investmentAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-300">Daily ROI:</span>
                              <span className="text-white">₹{((parseFloat(investmentAmount) * plan.daily_roi) / 100).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-300">Total Return:</span>
                              <span className="text-white">₹{((parseFloat(investmentAmount) * plan.total_return_percent) / 100).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold">
                              <span className="text-purple-300">Maturity Amount:</span>
                              <span className="text-white">₹{(parseFloat(investmentAmount) + ((parseFloat(investmentAmount) * plan.total_return_percent) / 100)).toLocaleString()}</span>
                            </div>
                          </div>
                        )}

                        {walletData && investmentAmount && parseFloat(investmentAmount) > walletData.total_balance && (
                          <div className="flex items-center space-x-2 text-red-400 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>Insufficient wallet balance</span>
                          </div>
                        )}
                        
                        <Button 
                          onClick={handleInvest}
                          disabled={investing || !investmentAmount || (walletData && parseFloat(investmentAmount) > walletData.total_balance)}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          {investing ? 'Processing...' : 'Confirm Investment'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>

          {plans.length === 0 && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">No Investment Plans Available</h3>
                <p className="text-purple-300">Investment plans will be available soon. Please check back later.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Invest;
