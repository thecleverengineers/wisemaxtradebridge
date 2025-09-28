
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  EyeOff
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
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
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
      
      // Add total_balance calculation
      const walletWithTotal = {
        ...walletResponse,
        total_balance: walletResponse.balance + walletResponse.roi_income + walletResponse.referral_income + walletResponse.bonus_income + walletResponse.level_income
      };
      setWalletData(walletWithTotal);

      // Fetch transactions from transactions table instead of wallet_transactions
      const { data: transactionsResponse, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!transactionsError && transactionsResponse) {
        // Map transactions to the expected format
        const mappedTransactions = transactionsResponse.map((tx: any) => ({
          id: tx.id,
          type: tx.type || 'transfer',
          income_type: tx.category || 'other',
          amount: tx.amount,
          balance_after: 0,
          reason: tx.notes || '',
          created_at: tx.created_at
        }));
        setTransactions(mappedTransactions);
      }

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
        .from('transactions')
        .insert([{
          user_id: user?.id,
          type: 'withdrawal',
          category: 'withdrawal',
          currency: 'USDT',
          amount: parseFloat(withdrawAmount.toString()),
          status: 'pending',
          notes: withdrawMethod === 'upi' ? `UPI: ${upiId}` : `Bank: ${bankDetails}`,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
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
        title: "Deposit Successful",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <WalletIcon className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
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
                <p className="text-purple-300">Manage your funds and transactions</p>
              </div>
            </div>
          </div>

          {/* Balance Card */}
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
                        className="text-white hover:bg-white/10"
                      >
                        {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">ROI Income</p>
                  <p className="text-white font-semibold">₹{walletData?.roi_income?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Referral Income</p>
                  <p className="text-white font-semibold">₹{walletData?.referral_income?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Bonus Income</p>
                  <p className="text-white font-semibold">₹{walletData?.bonus_income?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Total Withdrawn</p>
                  <p className="text-white font-semibold">₹{walletData?.total_withdrawn?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <ArrowDownLeft className="h-6 w-6 mr-2" />
                  Deposit
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Deposit Funds</DialogTitle>
                  <DialogDescription className="text-purple-300">
                    Add money to your wallet
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
                    />
                  </div>
                  <Button 
                    onClick={handleDeposit}
                    disabled={depositing || !depositAmount}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {depositing ? 'Processing...' : 'Deposit Now'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-16 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                  <ArrowUpRight className="h-6 w-6 mr-2" />
                  Withdraw
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
                    />
                    <p className="text-purple-300 text-sm mt-1">
                      Available: ₹{walletData?.total_balance?.toLocaleString() || '0'}
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
                    disabled={withdrawing || !withdrawAmount || (withdrawMethod === 'upi' && !upiId) || (withdrawMethod === 'bank' && (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName))}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  >
                    {withdrawing ? 'Processing...' : 'Submit Withdrawal Request'}
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
                  <DollarSign className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-purple-300">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => {
                    const TransactionIcon = getTransactionIcon(transaction.type);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
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
                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toLocaleString()}
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
