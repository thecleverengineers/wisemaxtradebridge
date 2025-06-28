
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Plus, Minus, ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface WalletData {
  id: string;
  total_balance: number;
  roi_income: number;
  referral_income: number;
  level_income: number;
  bonus_income: number;
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

interface Withdrawal {
  id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  status: string;
  withdrawal_method: string;
  upi_id?: string;
  bank_details?: any;
  requested_at: string;
  processed_at?: string;
}

const Wallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Fetch wallet data
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;
      setWallet(walletData);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;
      setWithdrawals(withdrawalsData || []);

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
    if (!withdrawAmount || !withdrawMethod || !user || !wallet) return;

    const amount = parseFloat(withdrawAmount);
    const feePercent = 2; // 2% withdrawal fee
    const feeAmount = (amount * feePercent) / 100;
    const netAmount = amount - feeAmount;

    if (amount > wallet.total_balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    if (amount < 100) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is ₹100",
        variant: "destructive",
      });
      return;
    }

    setWithdrawing(true);
    try {
      const withdrawalData: any = {
        user_id: user.id,
        amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        withdrawal_method: withdrawMethod,
      };

      if (withdrawMethod === 'upi' && upiId) {
        withdrawalData.upi_id = upiId;
      } else if (withdrawMethod === 'bank' && bankDetails) {
        withdrawalData.bank_details = JSON.parse(bankDetails);
      }

      const { error } = await supabase
        .from('withdrawals')
        .insert(withdrawalData);

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
        description: `Your withdrawal request for ₹${amount.toLocaleString()} has been submitted for approval`,
      });

      setWithdrawAmount('');
      setWithdrawMethod('');
      setUpiId('');
      setBankDetails('');
      fetchWalletData();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast({
        title: "Withdrawal Failed",
        description: "Failed to create withdrawal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-sm">IX</span>
          </div>
          <p>Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 pt-20 pb-20">
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
              <p className="text-purple-300">Manage your finances</p>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Balance</p>
                <p className="text-4xl font-bold">₹{wallet?.total_balance?.toLocaleString() || '0'}</p>
              </div>
              <WalletIcon className="h-12 w-12 text-blue-200" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Minus className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">Withdraw Funds</DialogTitle>
                    <DialogDescription className="text-purple-300">
                      Withdraw money from your wallet (2% processing fee applies)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="withdraw-amount" className="text-white">Amount (₹)</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="Minimum ₹100"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="withdraw-method" className="text-white">Withdrawal Method</Label>
                      <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10">
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {withdrawMethod === 'upi' && (
                      <div>
                        <Label htmlFor="upi-id" className="text-white">UPI ID</Label>
                        <Input
                          id="upi-id"
                          placeholder="your-upi@provider"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    )}
                    {withdrawMethod === 'bank' && (
                      <div>
                        <Label htmlFor="bank-details" className="text-white">Bank Details (JSON)</Label>
                        <Textarea
                          id="bank-details"
                          placeholder='{"account_number": "1234567890", "ifsc": "ABCD0123456", "name": "Your Name"}'
                          value={bankDetails}
                          onChange={(e) => setBankDetails(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    )}
                    {withdrawAmount && (
                      <div className="bg-white/5 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-300">Amount:</span>
                          <span className="text-white">₹{parseFloat(withdrawAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-300">Fee (2%):</span>
                          <span className="text-white">₹{((parseFloat(withdrawAmount) * 2) / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2">
                          <span className="text-purple-300">You'll receive:</span>
                          <span className="text-white">₹{(parseFloat(withdrawAmount) - (parseFloat(withdrawAmount) * 2) / 100).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    <Button 
                      onClick={handleWithdraw} 
                      disabled={withdrawing || !withdrawAmount || !withdrawMethod}
                      className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                    >
                      {withdrawing ? 'Processing...' : 'Submit Withdrawal'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <CreditCard className="h-4 w-4 mr-2" />
                Add Money
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Income Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-green-100 text-sm">ROI Income</p>
                <p className="text-2xl font-bold">₹{wallet?.roi_income?.toLocaleString() || '0'}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-blue-100 text-sm">Referral Income</p>
                <p className="text-2xl font-bold">₹{wallet?.referral_income?.toLocaleString() || '0'}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-purple-100 text-sm">Level Income</p>
                <p className="text-2xl font-bold">₹{wallet?.level_income?.toLocaleString() || '0'}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-orange-100 text-sm">Bonus Income</p>
                <p className="text-2xl font-bold">₹{wallet?.bonus_income?.toLocaleString() || '0'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <CardDescription className="text-purple-300">
              Your latest wallet activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-purple-300 text-center py-8">No transactions found.</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${transaction.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {transaction.type === 'credit' ? 
                          <ArrowUpRight className="h-4 w-4 text-green-400" /> : 
                          <ArrowDownRight className="h-4 w-4 text-red-400" />
                        }
                      </div>
                      <div>
                        <p className="text-white font-semibold">{transaction.reason}</p>
                        <p className="text-purple-300 text-sm">{new Date(transaction.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toLocaleString()}
                      </p>
                      <p className="text-purple-300 text-sm">₹{transaction.balance_after?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Withdrawal History</CardTitle>
            <CardDescription className="text-purple-300">
              Track your withdrawal requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-purple-300 text-center py-8">No withdrawals found.</p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-white font-semibold">₹{withdrawal.amount?.toLocaleString()}</p>
                        <p className="text-purple-300 text-sm">{withdrawal.withdrawal_method.toUpperCase()}</p>
                      </div>
                      <Badge className={`${
                        withdrawal.status === 'approved' ? 'bg-green-500' :
                        withdrawal.status === 'rejected' ? 'bg-red-500' :
                        'bg-yellow-500'
                      } text-white`}>
                        {withdrawal.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-purple-300">
                      <p>Requested: {new Date(withdrawal.requested_at).toLocaleDateString()}</p>
                      <p>Net Amount: ₹{withdrawal.net_amount?.toLocaleString()}</p>
                      {withdrawal.upi_id && <p>UPI: {withdrawal.upi_id}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
