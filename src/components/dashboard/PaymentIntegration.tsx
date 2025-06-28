import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Shield,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ArrowRight,
  Lock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletBalance } from '@/hooks/useWalletBalance';

interface PaymentMethod {
  id: string;
  type: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';
  name: string;
  icon: React.ReactNode;
  description: string;
  processingTime: string;
  fees: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'RETURN';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  method: string;
  timestamp: string;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'upi',
    type: 'UPI',
    name: 'UPI',
    icon: <Smartphone className="h-5 w-5" />,
    description: 'Pay using UPI apps like PhonePe, Paytm, GPay',
    processingTime: 'Instant',
    fees: 'Free'
  },
  {
    id: 'card',
    type: 'CARD',
    name: 'Credit/Debit Card',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Visa, Mastercard, RuPay cards accepted',
    processingTime: 'Instant',
    fees: '1.5% + GST'
  },
  {
    id: 'netbanking',
    type: 'NETBANKING',
    name: 'Net Banking',
    icon: <Wallet className="h-5 w-5" />,
    description: 'All major banks supported',
    processingTime: '2-5 minutes',
    fees: 'Free'
  },
  {
    id: 'wallet',
    type: 'WALLET',
    name: 'Wallet',
    icon: <Zap className="h-5 w-5" />,
    description: 'Paytm, PhonePe, Amazon Pay',
    processingTime: 'Instant',
    fees: 'Free'
  }
];

const mockTransactions: Transaction[] = [
  {
    id: 'txn_001',
    amount: 10000,
    type: 'DEPOSIT',
    status: 'SUCCESS',
    method: 'UPI',
    timestamp: '2024-01-15T10:30:00Z',
    description: 'Wallet top-up via UPI'
  },
  {
    id: 'txn_002',
    amount: 5000,
    type: 'INVESTMENT',
    status: 'SUCCESS',
    method: 'Wallet',
    timestamp: '2024-01-15T11:00:00Z',
    description: 'Investment in Gold Plan'
  },
  {
    id: 'txn_003',
    amount: 750,
    type: 'RETURN',
    status: 'SUCCESS',
    method: 'Wallet',
    timestamp: '2024-01-16T09:15:00Z',
    description: 'Daily ROI credit'
  },
  {
    id: 'txn_004',
    amount: 2000,
    type: 'WITHDRAWAL',
    status: 'PENDING',
    method: 'UPI',
    timestamp: '2024-01-16T14:20:00Z',
    description: 'Withdrawal to bank account'
  }
];

export const PaymentIntegration = () => {
  const { toast } = useToast();
  const { walletData, checkBalance, deductBalance } = useWalletBalance();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  const handleQuickPay = async (amount: number) => {
    // Check wallet balance for quick pay
    if (!checkBalance(amount)) {
      return;
    }

    setProcessing(true);
    try {
      const success = await deductBalance(
        amount,
        `Quick Pay - ₹${amount.toLocaleString()}`,
        `quick_pay_${Date.now()}`
      );

      if (success) {
        const newTransaction: Transaction = {
          id: `txn_${Date.now()}`,
          amount: amount,
          type: 'WITHDRAWAL',
          status: 'SUCCESS',
          method: 'wallet',
          description: `Quick Pay - ₹${amount.toLocaleString()}`,
          timestamp: new Date().toISOString()
        };

        setTransactions(prev => [newTransaction, ...prev]);
        
        toast({
          title: "Payment Successful",
          description: `Quick payment of ₹${amount.toLocaleString()} completed successfully`,
        });
      }
    } catch (error) {
      console.error('Quick pay error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process quick payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || !selectedMethod) return;

    const amount = parseFloat(paymentAmount);
    
    // Check wallet balance before payment
    if (!checkBalance(amount)) {
      return;
    }

    setProcessing(true);
    try {
      const success = await deductBalance(
        amount,
        `${selectedMethod.name} Payment - ₹${amount.toLocaleString()}`,
        `payment_${Date.now()}`
      );

      if (success) {
        const newTransaction: Transaction = {
          id: `txn_${Date.now()}`,
          amount: amount,
          type: 'WITHDRAWAL',
          status: 'SUCCESS',
          method: selectedMethod.name,
          description: `${selectedMethod.name} Payment`,
          timestamp: new Date().toISOString()
        };

        setTransactions(prev => [newTransaction, ...prev]);
        setPaymentAmount('');
        
        toast({
          title: "Payment Successful",
          description: `Payment of ₹${amount.toLocaleString()} completed successfully`,
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-600';
      case 'PENDING':
        return 'bg-yellow-600';
      case 'FAILED':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <AlertCircle className="h-4 w-4" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      {walletData && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wallet className="h-8 w-8" />
                <div>
                  <p className="text-blue-100">Wallet Balance</p>
                  <p className="text-3xl font-bold">₹{walletData.total_balance.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Available for Trading</p>
                <p className="text-xl font-semibold">₹{walletData.total_balance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10">
          <TabsTrigger value="payment">Add Money</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Add Money to Wallet
              </CardTitle>
              <CardDescription className="text-purple-300">
                Choose your preferred payment method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="amount" className="text-white text-sm">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
                <div className="flex space-x-2 mt-2">
                  {[1000, 2500, 5000, 10000].map((value) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount(value.toString())}
                      className="border-white/20 text-purple-300 hover:bg-white/10"
                    >
                      ₹{value}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-sm">Payment Method</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedMethod?.id === method.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-purple-400">{method.icon}</div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{method.name}</h4>
                          <p className="text-purple-300 text-sm">{method.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-green-400 text-xs">{method.processingTime}</span>
                            <span className="text-yellow-400 text-xs">Fee: {method.fees}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {paymentAmount && selectedMethod && (
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">Amount:</span>
                    <span className="text-white">₹{parseFloat(paymentAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">Processing Fee:</span>
                    <span className="text-white">
                      {selectedMethod.fees === 'Free' ? 'Free' : `₹${(parseFloat(paymentAmount) * 0.015).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2">
                    <span className="text-purple-300">Total:</span>
                    <span className="text-white">
                      ₹{(parseFloat(paymentAmount) + (selectedMethod.fees === 'Free' ? 0 : parseFloat(paymentAmount) * 0.015)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={!paymentAmount || !selectedMethod || processing}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {processing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Pay Securely with Razorpay
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                )}
              </Button>

              <div className="flex items-center justify-center space-x-2 text-sm text-purple-300">
                <Shield className="h-4 w-4" />
                <span>Secured by 256-bit SSL encryption</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Transaction History
              </CardTitle>
              <CardDescription className="text-purple-300">
                Your recent payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-purple-400">
                        {transaction.type === 'DEPOSIT' && <ArrowRight className="h-5 w-5 rotate-90" />}
                        {transaction.type === 'WITHDRAWAL' && <ArrowRight className="h-5 w-5 -rotate-90" />}
                        {transaction.type === 'INVESTMENT' && <DollarSign className="h-5 w-5" />}
                        {transaction.type === 'RETURN' && <Zap className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{transaction.description}</h4>
                        <p className="text-purple-300 text-sm">
                          {new Date(transaction.timestamp).toLocaleString()} • {transaction.method}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'DEPOSIT' || transaction.type === 'RETURN' 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {transaction.type === 'DEPOSIT' || transaction.type === 'RETURN' ? '+' : '-'}
                          ₹{transaction.amount.toLocaleString()}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(transaction.status)} text-white`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(transaction.status)}
                          <span>{transaction.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
