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

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalDeposits,
        pendingDeposits: 0, // Will be updated when deposit_transactions table is available
        totalWithdrawals: 0, // Will be updated when withdrawal_requests table is available
        pendingWithdrawals: 0,
        activeInvestments: activeInvestments || 0,
        totalInvestmentValue,
        activeTrades: activeTrades || 0,
        totalReferrals: totalReferrals || 0,
        totalWalletBalance,
        totalTransactions: totalTransactions || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};