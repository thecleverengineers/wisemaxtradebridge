import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get active users count
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get total investment from users table
      const { data: userInvestments } = await supabase
        .from('users')
        .select('total_investment');
      
      const totalDeposits = userInvestments?.reduce((sum, u) => sum + Number(u.total_investment || 0), 0) || 0;

      // Get active ROI investments
      const { count: activeInvestments } = await supabase
        .from('roi_investments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total investment value
      const { data: investments } = await supabase
        .from('roi_investments')
        .select('amount')
        .eq('status', 'active');
      
      const totalInvestmentValue = investments?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      // Get active binary trades
      const { count: activeTrades } = await supabase
        .from('binary_options_trades')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get total referrals
      const { count: totalReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true });

      // Get wallet balances
      const { data: wallets } = await supabase
        .from('wallets')
        .select('balance')
        .eq('currency', 'USDT');
      
      const totalWalletBalance = wallets?.reduce((sum, w) => sum + Number(w.balance), 0) || 0;

      // Get total transactions
      const { count: totalTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      // ===== Enhanced Platform Activity Stats =====
      
      // Binary Trading Activity
      const { data: binaryStats } = await supabase
        .from('binary_options_trades')
        .select('status, profit_loss, stake_amount');
      
      const binaryMetrics = {
        totalTrades: binaryStats?.length || 0,
        wonTrades: binaryStats?.filter(t => t.status === 'won').length || 0,
        lostTrades: binaryStats?.filter(t => t.status === 'lost').length || 0,
        totalVolume: binaryStats?.reduce((sum, t) => sum + Number(t.stake_amount || 0), 0) || 0,
        totalProfit: binaryStats?.reduce((sum, t) => sum + Number(t.profit_loss || 0), 0) || 0,
      };

      // Forex Trading Activity
      const { data: forexStats } = await supabase
        .from('forex_records')
        .select('status, profit_loss, volume, margin_used');
      
      const forexMetrics = {
        totalPositions: forexStats?.length || 0,
        openPositions: forexStats?.filter(p => p.status === 'open').length || 0,
        closedPositions: forexStats?.filter(p => p.status === 'closed').length || 0,
        totalVolume: forexStats?.reduce((sum, p) => sum + Number(p.volume || 0), 0) || 0,
        totalMargin: forexStats?.reduce((sum, p) => sum + Number(p.margin_used || 0), 0) || 0,
        totalPnL: forexStats?.reduce((sum, p) => sum + Number(p.profit_loss || 0), 0) || 0,
      };

      // ROI Investment Activity
      const { data: roiStats } = await supabase
        .from('roi_investments')
        .select('status, amount, total_paid_out');
      
      const roiMetrics = {
        totalInvestments: roiStats?.length || 0,
        activeInvestments: roiStats?.filter(i => i.status === 'active').length || 0,
        completedInvestments: roiStats?.filter(i => i.status === 'completed').length || 0,
        totalInvested: roiStats?.reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0,
        totalPaidOut: roiStats?.reduce((sum, i) => sum + Number(i.total_paid_out || 0), 0) || 0,
      };

      // USDT Staking Activity
      const { data: stakingStats } = await supabase
        .from('usdtstaking_records')
        .select('status, amount, total_earned, plan_type');
      
      const stakingMetrics = {
        totalStakes: stakingStats?.length || 0,
        activeStakes: stakingStats?.filter(s => s.status === 'active').length || 0,
        flexibleStakes: stakingStats?.filter(s => s.plan_type === 'flexible').length || 0,
        lockedStakes: stakingStats?.filter(s => s.plan_type === 'locked').length || 0,
        totalStaked: stakingStats?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0,
        totalEarned: stakingStats?.reduce((sum, s) => sum + Number(s.total_earned || 0), 0) || 0,
      };

      // Deposit Activity
      const { data: depositStats } = await supabase
        .from('deposit_transactions')
        .select('status, amount');
      
      const depositMetrics = {
        totalDeposits: depositStats?.length || 0,
        pendingDeposits: depositStats?.filter(d => d.status === 'pending').length || 0,
        approvedDeposits: depositStats?.filter(d => d.status === 'approved').length || 0,
        rejectedDeposits: depositStats?.filter(d => d.status === 'rejected').length || 0,
        totalDepositAmount: depositStats?.filter(d => d.status === 'approved').reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0,
      };

      // Withdrawal Activity
      const { data: withdrawalStats } = await supabase
        .from('withdrawal_requests')
        .select('status, amount');
      
      const withdrawalMetrics = {
        totalWithdrawals: withdrawalStats?.length || 0,
        pendingWithdrawals: withdrawalStats?.filter(w => w.status === 'pending').length || 0,
        completedWithdrawals: withdrawalStats?.filter(w => w.status === 'completed').length || 0,
        rejectedWithdrawals: withdrawalStats?.filter(w => w.status === 'rejected').length || 0,
        totalWithdrawalAmount: withdrawalStats?.filter(w => w.status === 'completed').reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0,
      };

      // Recent Activity Timeline
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        // Basic Stats
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalDeposits,
        pendingDeposits: depositMetrics.pendingDeposits,
        totalWithdrawals: withdrawalMetrics.totalWithdrawalAmount,
        pendingWithdrawals: withdrawalMetrics.pendingWithdrawals,
        activeInvestments: activeInvestments || 0,
        totalInvestmentValue,
        activeTrades: activeTrades || 0,
        totalReferrals: totalReferrals || 0,
        totalWalletBalance,
        totalTransactions: totalTransactions || 0,
        
        // Enhanced Activity Metrics
        binaryMetrics,
        forexMetrics,
        roiMetrics,
        stakingMetrics,
        depositMetrics,
        withdrawalMetrics,
        recentTransactions,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};