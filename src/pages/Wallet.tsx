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
import { DepositDialog } from '@/components/wallet/DepositDialog';

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

interface WithdrawalRequest {
  id: string;
  amount: number;
  wallet_address: string;
  network: string;
  status: string;
  created_at: string;
  processed_at?: string;
  admin_note?: string;
}

const Wallet = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  
  const [showBalance, setShowBalance] = useState(true);
  
  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const [copied, setCopied] = useState(false);

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

      // Fetch withdrawal requests
      const { data: withdrawalResponse, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!withdrawalError && withdrawalResponse) {
        setWithdrawalRequests(withdrawalResponse);
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

    const amount = parseFloat(withdrawAmount);
    
    // Minimum withdrawal check
    if (amount < 20) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is 20 USDT",
        variant: "destructive",
      });
      return;
    }

    if (amount > (walletData?.total_balance || 0)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    setWithdrawing(true);
    try {
      const withdrawalFee = amount * 0.10; // 10% fee
      const netAmount = amount - withdrawalFee;
      
      // Get current wallet
      const { data: currentWallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .eq('currency', 'USDT')
        .single();

      if (walletError) throw new Error('Failed to fetch wallet data');
      if (!currentWallet) throw new Error('Wallet not found');

      const newBalance = currentWallet.balance - amount;
      const newLockedBalance = (currentWallet.locked_balance || 0) + netAmount;
      
      // Create withdrawal request with net amount
      const { error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user?.id,
          amount: netAmount,
          wallet_address: withdrawAddress,
          network: 'BEP20',
          status: 'pending'
        });

      if (withdrawalError) throw withdrawalError;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          locked_balance: newLockedBalance
        })
        .eq('id', currentWallet.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'debit',
          income_type: 'withdrawal',
          amount: amount,
          balance_after: newBalance,
          reason: `Withdrawal request - Net: ${netAmount.toFixed(2)} USDT, Fee: ${withdrawalFee.toFixed(2)} USDT`,
          category: 'withdrawal',
          currency: 'USDT',
          to_address: withdrawAddress,
          network: 'BEP20',
          status: 'pending'
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Withdrawal Request Submitted",
        description: `Your withdrawal of ${netAmount.toFixed(2)} USDT is pending admin approval. Fee: ${withdrawalFee.toFixed(2)} USDT (10%)`,
      });

      setWithdrawAmount('');
      setWithdrawAddress('');
      await fetchWalletData();
    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Withdrawal Failed",
        description: error?.message || "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
  };


  const getTransactionIcon = (type: string) => {
    return type === 'deposit' || type === 'roi' || type === 'referral' ? ArrowDownLeft : ArrowUpRight;
  };

  const getTransactionColor = (type: string) => {
    return type === 'deposit' || type === 'roi' || type === 'referral' ? 'text-primary' : 'text-destructive';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };


  return (
    <div className="min-h-screen bg-background">
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
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">USDT Wallet</h1>
                <p className="text-muted-foreground">Manage your USDT funds</p>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <WalletIcon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-muted-foreground">USDT Balance (BEP20)</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-3xl font-bold text-foreground">
                        {showBalance ? `${walletData?.total_balance?.toFixed(2) || '0.00'} USDT` : '****'}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowBalance(!showBalance)}
                      >
                        {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">ROI Income</p>
                  <p className="text-foreground font-semibold">{walletData?.roi_income?.toFixed(2) || '0.00'} USDT</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Referral Income</p>
                  <p className="text-foreground font-semibold">{walletData?.referral_income?.toFixed(2) || '0.00'} USDT</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Bonus Income</p>
                  <p className="text-foreground font-semibold">{walletData?.bonus_income?.toFixed(2) || '0.00'} USDT</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Withdrawn</p>
                  <p className="text-foreground font-semibold">{walletData?.total_withdrawn?.toFixed(2) || '0.00'} USDT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <DepositDialog 
              userId={user?.id || ''} 
              onDepositCreated={fetchWalletData}
            />

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="h-16">
                  <ArrowUpRight className="h-6 w-6 mr-2" />
                  Withdraw USDT
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Withdraw USDT (BEP20)</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Withdraw USDT to your BEP20 wallet
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="withdraw-amount" className="text-foreground">Amount (USDT)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      step="0.01"
                      placeholder="Enter amount to withdraw"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <p className="text-muted-foreground text-sm mt-1">
                      Available: {walletData?.total_balance?.toFixed(2) || '0.00'} USDT
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="withdraw-address" className="text-foreground">USDT BEP20 Wallet Address</Label>
                    <Input
                      id="withdraw-address"
                      type="text"
                      placeholder="Enter your USDT BEP20 address"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>

                  {withdrawAmount && (
                    <div className="bg-muted rounded-lg p-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Withdrawal Amount:</span>
                        <span className="text-foreground">{parseFloat(withdrawAmount).toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Withdrawal Fee (10%):</span>
                        <span className="text-destructive">-{(parseFloat(withdrawAmount) * 0.10).toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-border pt-1">
                        <span className="text-foreground">You'll Receive:</span>
                        <span className="text-primary">{(parseFloat(withdrawAmount) * 0.90).toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Network:</span>
                        <span className="text-foreground">BEP20</span>
                      </div>
                    </div>
                  )}

                  <Alert className="bg-muted border-border">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <AlertDescription className="text-muted-foreground">
                      Withdrawals require admin approval and may take 24-48 hours to process.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    variant="destructive"
                    onClick={handleWithdraw}
                    disabled={withdrawing || !withdrawAmount || !withdrawAddress}
                    className="w-full"
                  >
                    {withdrawing ? 'Processing...' : 'Submit Withdrawal Request'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Withdrawal Requests */}
          {withdrawalRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowUpRight className="h-5 w-5 mr-2" />
                  Withdrawal Requests
                </CardTitle>
                <CardDescription>
                  Track your pending withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {withdrawalRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-foreground font-medium">{request.amount.toFixed(2)} USDT</h4>
                          <Badge 
                            variant={
                              request.status === 'approved' ? 'default' :
                              request.status === 'pending' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Network: {request.network}
                        </p>
                        <p className="text-muted-foreground text-xs font-mono truncate">
                          To: {request.wallet_address}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Requested: {new Date(request.created_at).toLocaleDateString()} • 
                          {new Date(request.created_at).toLocaleTimeString()}
                        </p>
                        {request.processed_at && (
                          <p className="text-muted-foreground text-xs">
                            Processed: {new Date(request.processed_at).toLocaleDateString()}
                          </p>
                        )}
                        {request.admin_note && (
                          <p className="text-destructive text-xs mt-1">
                            Note: {request.admin_note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Transaction History
              </CardTitle>
              <CardDescription>
                Your recent USDT transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => {
                    const TransactionIcon = getTransactionIcon(transaction.type);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-background">
                            <TransactionIcon className={`h-4 w-4 ${getTransactionColor(transaction.type)}`} />
                          </div>
                          <div>
                            <h4 className="text-foreground font-medium capitalize">{transaction.type}</h4>
                            <p className="text-muted-foreground text-sm">
                              {new Date(transaction.created_at).toLocaleDateString()} • 
                              {new Date(transaction.created_at).toLocaleTimeString()}
                            </p>
                            {transaction.tx_hash && (
                              <p className="text-muted-foreground text-xs font-mono">
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