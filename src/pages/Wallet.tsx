import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  DollarSign,
  Copy,
  Check,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle
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
  category: string;
  amount: number;
  status: string;
  notes: string;
  created_at: string;
  from_address?: string;
  to_address?: string;
  tx_hash?: string;
}

const Wallet = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [showBalance, setShowBalance] = useState(true);
  
  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTransactionId, setDepositTransactionId] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Admin USDT wallet address for deposits
  const ADMIN_USDT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'; // BEP20 address

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Fetch USDT wallet for the user
      const { data: walletsResponse, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;
      
      // Calculate totals for USDT wallet
      const totalData = walletsResponse?.[0] ? {
        total_balance: walletsResponse[0].balance || 0,
        roi_income: walletsResponse[0].roi_income || 0,
        referral_income: walletsResponse[0].referral_income || 0,
        bonus_income: walletsResponse[0].bonus_income || 0,
        level_income: walletsResponse[0].level_income || 0,
        total_withdrawn: walletsResponse[0].total_withdrawn || 0
      } : {
        total_balance: 0,
        roi_income: 0,
        referral_income: 0,
        bonus_income: 0,
        level_income: 0,
        total_withdrawn: 0
      };
      
      setWalletData(totalData);

      // Fetch transactions
      const { data: transactionsResponse, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('currency', 'USDT')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!transactionsError && transactionsResponse) {
        setTransactions(transactionsResponse);
      }

    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
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

    if (!withdrawAddress) {
      toast({
        title: "Missing Address",
        description: "Please enter your USDT BEP20 wallet address",
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
      // Create withdrawal transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user?.id,
          type: 'withdrawal',
          category: 'withdrawal',
          currency: 'USDT',
          amount: parseFloat(withdrawAmount),
          status: 'pending',
          to_address: withdrawAddress,
          network: 'BEP20',
          notes: `USDT withdrawal to ${withdrawAddress}`,
          created_at: new Date().toISOString()
        }]);

      if (txError) throw txError;

      // Update wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .eq('currency', 'USDT')
        .single();

      if (!walletError && walletData) {
        const { error: updateError } = await supabase
          .from('wallets')
          .update({
            balance: walletData.balance - parseFloat(withdrawAmount)
          })
          .eq('id', walletData.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request is pending admin approval",
      });

      setWithdrawAmount('');
      setWithdrawAddress('');
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

    if (!depositTransactionId) {
      toast({
        title: "Missing Transaction ID",
        description: "Please enter your USDT transaction ID",
        variant: "destructive",
      });
      return;
    }

    setDepositing(true);
    try {
      // Create deposit transaction
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user?.id,
          type: 'deposit',
          category: 'deposit',
          currency: 'USDT',
          amount: parseFloat(depositAmount),
          status: 'pending',
          from_address: ADMIN_USDT_ADDRESS,
          network: 'BEP20',
          tx_hash: depositTransactionId,
          notes: `USDT deposit - TxID: ${depositTransactionId}`,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Deposit Request Submitted",
        description: "Your deposit is pending admin approval",
      });

      setDepositAmount('');
      setDepositTransactionId('');
      fetchWalletData();
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast({
        title: "Deposit Failed",
        description: "Failed to submit deposit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDepositing(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(ADMIN_USDT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Address Copied",
      description: "USDT BEP20 address copied to clipboard",
    });
  };

  const getTransactionIcon = (type: string) => {
    return type === 'deposit' || type === 'roi' || type === 'referral' ? ArrowDownLeft : ArrowUpRight;
  };

  const getTransactionColor = (type: string) => {
    return type === 'deposit' || type === 'roi' || type === 'referral' ? 'text-green-400' : 'text-red-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
                <h1 className="text-2xl font-bold text-white">USDT Wallet</h1>
                <p className="text-purple-300">Manage your USDT funds</p>
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
                    <p className="text-blue-100">USDT Balance (BEP20)</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-3xl font-bold">
                        {showBalance ? `${walletData?.total_balance?.toFixed(2) || '0.00'} USDT` : '****'}
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
                  <p className="text-white font-semibold">{walletData?.roi_income?.toFixed(2) || '0.00'} USDT</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Referral Income</p>
                  <p className="text-white font-semibold">{walletData?.referral_income?.toFixed(2) || '0.00'} USDT</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Bonus Income</p>
                  <p className="text-white font-semibold">{walletData?.bonus_income?.toFixed(2) || '0.00'} USDT</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Total Withdrawn</p>
                  <p className="text-white font-semibold">{walletData?.total_withdrawn?.toFixed(2) || '0.00'} USDT</p>
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
                  Deposit USDT
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Deposit USDT (BEP20)</DialogTitle>
                  <DialogDescription className="text-purple-300">
                    Send USDT to the address below and enter transaction details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert className="bg-blue-500/10 border-blue-500/20">
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-300">
                      Send USDT only on BEP20 network. Sending on wrong network may result in loss of funds.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="admin-address" className="text-white">USDT BEP20 Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="admin-address"
                        value={ADMIN_USDT_ADDRESS}
                        readOnly
                        className="bg-white/5 border-white/10 text-white font-mono text-sm"
                      />
                      <Button
                        onClick={copyAddress}
                        variant="outline"
                        size="icon"
                        className="bg-white/5 border-white/10 hover:bg-white/10"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="deposit-amount" className="text-white">Amount (USDT)</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      step="0.01"
                      placeholder="Enter amount to deposit"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="transaction-id" className="text-white">Transaction ID</Label>
                    <Input
                      id="transaction-id"
                      type="text"
                      placeholder="Enter transaction ID after payment"
                      value={depositTransactionId}
                      onChange={(e) => setDepositTransactionId(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <p className="text-purple-300 text-sm mt-1">
                      Enter the transaction hash after sending USDT
                    </p>
                  </div>

                  <Button 
                    onClick={handleDeposit}
                    disabled={depositing || !depositAmount || !depositTransactionId}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {depositing ? 'Submitting...' : 'Submit Deposit Request'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-16 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                  <ArrowUpRight className="h-6 w-6 mr-2" />
                  Withdraw USDT
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-white/10 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Withdraw USDT (BEP20)</DialogTitle>
                  <DialogDescription className="text-purple-300">
                    Withdraw USDT to your BEP20 wallet
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="withdraw-amount" className="text-white">Amount (USDT)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      step="0.01"
                      placeholder="Enter amount to withdraw"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <p className="text-purple-300 text-sm mt-1">
                      Available: {walletData?.total_balance?.toFixed(2) || '0.00'} USDT
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="withdraw-address" className="text-white">USDT BEP20 Wallet Address</Label>
                    <Input
                      id="withdraw-address"
                      type="text"
                      placeholder="Enter your USDT BEP20 address"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      className="bg-white/5 border-white/10 text-white font-mono text-sm"
                    />
                  </div>

                  {withdrawAmount && (
                    <div className="bg-white/5 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Withdrawal Amount:</span>
                        <span className="text-white">{parseFloat(withdrawAmount).toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Network:</span>
                        <span className="text-white">BEP20</span>
                      </div>
                    </div>
                  )}

                  <Alert className="bg-yellow-500/10 border-yellow-500/20">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-300">
                      Withdrawals require admin approval and may take 24-48 hours to process.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={handleWithdraw}
                    disabled={withdrawing || !withdrawAmount || !withdrawAddress}
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
                Your recent USDT transactions
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
                            <h4 className="text-white font-medium capitalize">{transaction.type}</h4>
                            <p className="text-purple-300 text-sm">
                              {new Date(transaction.created_at).toLocaleDateString()} • 
                              {new Date(transaction.created_at).toLocaleTimeString()}
                            </p>
                            {transaction.tx_hash && (
                              <p className="text-purple-400 text-xs font-mono">
                                TxID: {transaction.tx_hash.substring(0, 10)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'deposit' || transaction.type === 'roi' || transaction.type === 'referral' ? '+' : '-'}
                            {transaction.amount?.toFixed(2)} USDT
                          </p>
                          {getStatusBadge(transaction.status)}
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