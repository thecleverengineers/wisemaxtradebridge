import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  DollarSign, 
  Search, 
  PiggyBank,
  Clock,
  Activity,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Wallet,
  Lock,
  Users,
  Gift,
  Trophy,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  status: string;
  created_at: string;
  notes: string | null;
  currency: string;
}

interface OverallStats {
  totalTransactions: number;
  totalIncome: number;
  totalInvestments: number;
  activePositions: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
}

const InvestmentRecords = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalTransactions: 0,
    totalIncome: 0,
    totalInvestments: 0,
    activePositions: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchAllRecords();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscriptions
    const transactionChannel = supabase
      .channel('transaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchAllRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionChannel);
    };
  }, [user]);

  const fetchAllRecords = async () => {
    try {
      // Fetch all transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (txError) throw txError;
      setTransactions(txData || []);

      // Fetch active investments count
      const { data: investmentsData } = await supabase
        .from('investments')
        .select('id, amount, status')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      // Fetch active staking positions count
      const { data: stakingData } = await supabase
        .from('staking_records')
        .select('id, amount, status')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      calculateStats(txData || [], investmentsData || [], stakingData || []);

    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction records",
        variant: "destructive",
      });
    }
  };

  const calculateStats = (
    transactions: Transaction[], 
    investments: any[], 
    staking: any[]
  ) => {
    const totalIncome = transactions
      .filter(tx => ['roi_earning', 'staking_reward', 'referral_income', 'bonus', 'reward', 'binary_win'].includes(tx.type))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const totalInvestments = transactions
      .filter(tx => ['investment', 'stake', 'binary_trade'].includes(tx.type))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const activePositions = investments.length + staking.length;

    // Calculate today's earnings
    const today = new Date().toDateString();
    const todayEarnings = transactions
      .filter(tx => 
        ['roi_earning', 'staking_reward', 'referral_income', 'bonus', 'reward', 'binary_win'].includes(tx.type) &&
        new Date(tx.created_at).toDateString() === today
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate this week's earnings
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyEarnings = transactions
      .filter(tx => 
        ['roi_earning', 'staking_reward', 'referral_income', 'bonus', 'reward', 'binary_win'].includes(tx.type) &&
        new Date(tx.created_at) >= weekAgo
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate this month's earnings
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyEarnings = transactions
      .filter(tx => {
        const txDate = new Date(tx.created_at);
        return ['roi_earning', 'staking_reward', 'referral_income', 'bonus', 'reward', 'binary_win'].includes(tx.type) &&
               txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    setOverallStats({
      totalTransactions: transactions.length,
      totalIncome,
      totalInvestments,
      activePositions,
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'roi_earning': return <Target className="h-4 w-4" />;
      case 'staking_reward': return <Lock className="h-4 w-4" />;
      case 'referral_income': return <Users className="h-4 w-4" />;
      case 'bonus': return <Gift className="h-4 w-4" />;
      case 'reward': return <Trophy className="h-4 w-4" />;
      case 'binary_win': return <Zap className="h-4 w-4" />;
      case 'investment': return <PiggyBank className="h-4 w-4" />;
      case 'stake': return <Lock className="h-4 w-4" />;
      case 'deposit': return <ArrowDownRight className="h-4 w-4" />;
      case 'withdraw': return <ArrowUpRight className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    const incomeTypes = ['roi_earning', 'staking_reward', 'referral_income', 'bonus', 'reward', 'binary_win', 'deposit'];
    const expenseTypes = ['investment', 'stake', 'binary_trade', 'withdraw'];
    
    if (incomeTypes.includes(type)) return 'text-green-600 dark:text-green-400';
    if (expenseTypes.includes(type)) return 'text-orange-600 dark:text-orange-400';
    return 'text-foreground';
  };

  const getTransactionBgColor = (type: string) => {
    const incomeTypes = ['roi_earning', 'staking_reward', 'referral_income', 'bonus', 'reward', 'binary_win', 'deposit'];
    if (incomeTypes.includes(type)) return 'bg-green-500/10';
    return 'bg-orange-500/10';
  };

  const formatTransactionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      (tx.notes?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.type?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.category?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Transaction Records</h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Complete overview of all your financial activities
            </p>
          </div>

          {/* Overall Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${overallStats.totalIncome.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      From all sources
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Invested</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${overallStats.totalInvestments.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {overallStats.activePositions} active positions
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <PiggyBank className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Today's Earnings</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${overallStats.todayEarnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last 24 hours
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Monthly Earnings</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${overallStats.monthlyEarnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      This month
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="trading">Trading</SelectItem>
                      <SelectItem value="earnings">Earnings</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="roi_earning">ROI Earning</SelectItem>
                      <SelectItem value="staking_reward">Staking Reward</SelectItem>
                      <SelectItem value="referral_income">Referral Income</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="reward">Reward</SelectItem>
                      <SelectItem value="binary_win">Binary Win</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="stake">Stake</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                All Transactions
              </CardTitle>
              <CardDescription>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Transactions Found</h3>
                    <p className="text-muted-foreground">Your transaction history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map((tx) => (
                      <div 
                        key={tx.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${getTransactionBgColor(tx.type)}`}>
                            {getTransactionIcon(tx.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground font-medium">
                              {formatTransactionType(tx.type)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {tx.notes || tx.category}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${getTransactionColor(tx.type)}`}>
                            {['investment', 'stake', 'binary_trade', 'withdraw'].includes(tx.type) ? '-' : '+'}
                            ${tx.amount.toFixed(2)}
                          </p>
                          <Badge 
                            variant={tx.status === 'completed' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {overallStats.totalTransactions}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Weekly Earnings</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  ${overallStats.weeklyEarnings.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Active Positions</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {overallStats.activePositions}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default InvestmentRecords;
