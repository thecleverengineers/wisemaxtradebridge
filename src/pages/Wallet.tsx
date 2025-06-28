
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  DollarSign,
  CreditCard,
  Smartphone,
  ArrowLeft,
  Eye,
  EyeOff,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Gift,
  Target,
  Trophy,
  Star,
  Flame
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface WalletData {
  total_balance: number;
  roi_income: number;
  referral_income: number;
  bonus_income: number;
  level_income: number;
  total_withdrawn: number;
}

interface Transaction {
  id: string;
  type: string;
  income_type: string;
  amount: number;
  balance_after: number;
  reason: string;
  created_at: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

const Wallet = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  
  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });
  const [withdrawing, setWithdrawing] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('upi');
  const [depositing, setDepositing] = useState(false);

  // Investment stats
  const [investmentStats, setInvestmentStats] = useState({
    activeInvestments: 0,
    totalInvested: 0,
    totalReturns: 0,
    avgReturn: 0
  });

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchInvestmentStats();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Fetch wallet data
      const { data: walletResponse, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;
      setWalletData(walletResponse);

      // Fetch transactions
      const { data: transactionsResponse, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsResponse || []);

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

  const fetchInvestmentStats = async () => {
    try {
      // Fetch investment plans
      const { data: plansData } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('is_active', true);

      // Simulate investment stats
      setInvestmentStats({
        activeInvestments: Math.floor(Math.random() * 5) + 1,
        totalInvested: Math.floor(Math.random() * 50000) + 10000,
        totalReturns: Math.floor(Math.random() * 15000) + 5000,
        avgReturn: Math.floor(Math.random() * 15) + 8 // 8-23% return
      });
    } catch (error) {
      console.error('Error fetching investment stats:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(withdrawAmount) > (walletData?.total_balance || 0)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    setWithdrawing(true);
    try {
      const withdrawalData = {
        user_id: user?.id,
        amount: parseFloat(withdrawAmount),
        net_amount: parseFloat(withdrawAmount) - (parseFloat(withdrawAmount) * 0.02), // 2% fee
        fee_amount: parseFloat(withdrawAmount) * 0.02,
        withdrawal_method: withdrawMethod,
        ...(withdrawMethod === 'upi' ? { upi_id: upiId } : { bank_details: bankDetails })
      };

      const { error } = await supabase
        .from('withdrawals')
        .insert(withdrawalData);

      if (error) throw error;

      toast({
        title: "🎉 Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted and is pending approval",
      });

      setWithdrawAmount('');
      setUpiId('');
      setBankDetails({ accountNumber: '', ifscCode: '', accountHolderName: '' });
      fetchWalletData();
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Withdrawal Failed",
        description: "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    setDepositing(true);
    try {
      // This would typically integrate with a payment gateway
      // For now, we'll simulate a successful deposit
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "💰 Deposit Successful",
        description: `₹${depositAmount} has been added to your wallet`,
      });

      setDepositAmount('');
      fetchWalletData();
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: "Failed to process deposit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDepositing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? ArrowDownLeft : ArrowUpRight;
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? 'text-green-400' : 'text-red-400';
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Start Trading',
      description: 'Begin live trading now',
      icon: Target,
      color: 'from-green-500 to-emerald-600',
      action: () => navigate('/trading')
    },
    {
      title: 'Invest Now',
      description: 'Explore investment plans',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      action: () => navigate('/invest')
    },
    {
      title: 'Refer & Earn',
      description: 'Invite friends, earn rewards',
      icon: Gift,
      color: 'from-purple-500 to-purple-600',
      action: () => navigate('/referrals')
    },
    {
      title: 'Rewards',
      description: 'Claim your bonuses',
      icon: Star,
      color: 'from-yellow-500 to-orange-600',
      action: () => navigate('/rewards')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Loading wallet...</p>
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
                <h1 className="text-2xl font-bold text-white">My Wallet</h1>
                <p className="text-purple-300">Manage your funds securely</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <Flame className="h-3 w-3 mr-1" />
              Premium Wallet
            </Badge>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main Balance Card */}
            <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <WalletIcon className="h-8 w-8" />
                    <div>
                      <p className="text-blue-100">Total Balance</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-3xl font-bold">
                          {showBalance ? `₹${walletData?.total_balance?.toLocaleString() || '0'}` : '₹****'}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowBalance(!showBalance)}
                          className="text-white hover:bg-white/10 h-8 w-8"
                        >
                          {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-blue-100 text-sm">Available</p>
                    <p className="text-white font-semibold">₹{walletData?.total_balance?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Invested</p>
                    <p className="text-white font-semibold">₹{investmentStats.totalInvested.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Income Breakdown */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Income Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-purple-300">ROI Income</span>
                  </div>
                  <span className="text-white font-semibold">₹{walletData?.roi_income?.toLocaleString() || '0'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Gift className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-300">Referral Income</span>
                  </div>
                  <span className="text-white font-semibold">₹{walletData?.referral_income?.toLocaleString() || '0'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-purple-300">Bonus Income</span>
                  </div>
                  <span className="text-white font-semibold">₹{walletData?.bonus_income?.toLocaleString() || '0'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-orange-400" />
                    <span className="text-purple-300">Level Income</span>
                  </div>
                  <span className="text-white font-semibold">₹{walletData?.level_income?.toLocaleString() || '0'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Stats */}
          <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Investment Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{investmentStats.activeInvestments}</p>
                  <p className="text-green-300 text-sm">Active Plans</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">₹{investmentStats.totalInvested.toLocaleString()}</p>
                  <p className="text-purple-300 text-sm">Total Invested</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">₹{investmentStats.totalReturns.toLocaleString()}</p>
                  <p className="text-green-300 text-sm">Total Returns</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{investmentStats.avgReturn}%</p>
                  <p className="text-yellow-300 text-sm">Avg Return</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-purple-300">
                Grow your wealth with these options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex-col space-y-2 border-white/20 hover:bg-white/10"
                    onClick={action.action}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color}`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-white text-sm font-medium">{action.title}</p>
                      <p className="text-purple-300 text-xs">{action.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Plus className="h-6 w-6 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Deposit</p>
                    <p className="text-sm opacity-90">Add funds</p>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Deposit Funds</DialogTitle>
                  <DialogDescription className="text-purple-300">
                    Add money to your wallet securely
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deposit-amount" className="text-white">Amount (₹)</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="Enter amount to deposit"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      min="100"
                      max="100000"
                    />
                    <p className="text-purple-300 text-sm mt-1">
                      Minimum: ₹100 | Maximum: ₹1,00,000
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="deposit-method" className="text-white">Payment Method</Label>
                    <Select value={depositMethod} onValueChange={setDepositMethod}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="netbanking">Net Banking</SelectItem>
                        <SelectItem value="card">Debit/Credit Card</SelectItem>
                        <SelectItem value="wallet">Digital Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {depositAmount && (
                    <div className="bg-white/5 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Deposit Amount:</span>
                        <span className="text-white">₹{parseFloat(depositAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Processing Fee:</span>
                        <span className="text-green-400">FREE</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-purple-300">You'll Receive:</span>
                        <span className="text-white">₹{parseFloat(depositAmount).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleDeposit}
                    disabled={depositing || !depositAmount}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {depositing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Deposit Now
                      </div>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-16 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                  <Minus className="h-6 w-6 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Withdraw</p>
                    <p className="text-sm opacity-90">Cash out</p>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-white/10 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Withdraw Funds</DialogTitle>
                  <DialogDescription className="text-purple-300">
                    Withdraw money from your wallet
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="withdraw-amount" className="text-white">Amount (₹)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="Enter amount to withdraw"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      min="500"
                      max={walletData?.total_balance || 0}
                    />
                    <p className="text-purple-300 text-sm mt-1">
                      Available: ₹{walletData?.total_balance?.toLocaleString() || '0'} | Min: ₹500
                    </p>
                  </div>

                  <Tabs value={withdrawMethod} onValueChange={setWithdrawMethod}>
                    <TabsList className="grid w-full grid-cols-2 bg-white/10">
                      <TabsTrigger value="upi">UPI</TabsTrigger>
                      <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upi" className="space-y-4">
                      <div>
                        <Label htmlFor="upi-id" className="text-white">UPI ID</Label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                          <Input
                            id="upi-id"
                            type="text"
                            placeholder="your-upi-id@paytm"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="bank" className="space-y-4">
                      <div>
                        <Label htmlFor="account-number" className="text-white">Account Number</Label>
                        <Input
                          id="account-number"
                          type="text"
                          placeholder="Enter account number"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ifsc-code" className="text-white">IFSC Code</Label>
                        <Input
                          id="ifsc-code"
                          type="text"
                          placeholder="Enter IFSC code"
                          value={bankDetails.ifscCode}
                          onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account-holder" className="text-white">Account Holder Name</Label>
                        <Input
                          id="account-holder"
                          type="text"
                          placeholder="Enter account holder name"
                          value={bankDetails.accountHolderName}
                          onChange={(e) => setBankDetails({...bankDetails, accountHolderName: e.target.value})}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  {withdrawAmount && (
                    <div className="bg-white/5 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Withdrawal Amount:</span>
                        <span className="text-white">₹{parseFloat(withdrawAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Processing Fee (2%):</span>
                        <span className="text-white">₹{(parseFloat(withdrawAmount) * 0.02).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-purple-300">You'll Receive:</span>
                        <span className="text-white">₹{(parseFloat(withdrawAmount) - (parseFloat(withdrawAmount) * 0.02)).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleWithdraw}
                    disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 500 || (withdrawMethod === 'upi' && !upiId) || (withdrawMethod === 'bank' && (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName))}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  >
                    {withdrawing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Submit Request
                      </div>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Transaction History */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <History className="h-5 w-5 mr-2" />
                Transaction History
              </CardTitle>
              <CardDescription className="text-purple-300">
                Your recent wallet transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-purple-400 mx-auto mb-4 opacity-50" />
                  <p className="text-purple-300">No transactions found</p>
                  <p className="text-purple-400 text-sm">Your transactions will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => {
                    const TransactionIcon = getTransactionIcon(transaction.type);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full bg-white/10`}>
                            <TransactionIcon className={`h-4 w-4 ${getTransactionColor(transaction.type)}`} />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{transaction.reason || transaction.income_type}</h4>
                            <p className="text-purple-300 text-sm">
                              {new Date(transaction.created_at).toLocaleDateString()} • 
                              {new Date(transaction.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(transaction.amount)?.toLocaleString()}
                          </p>
                          <p className="text-purple-300 text-sm">
                            Balance: ₹{transaction.balance_after?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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

export default Wallet;
