
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WalletData {
  total_balance: number;
  roi_income: number;
  referral_income: number;
  bonus_income: number;
  level_income: number;
  total_withdrawn: number;
}

export const useWalletBalance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
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

  const checkBalance = (requiredAmount: number): boolean => {
    if (!walletData) {
      toast({
        title: "Wallet Error",
        description: "Unable to check wallet balance",
        variant: "destructive",
      });
      return false;
    }

    if (walletData.total_balance < requiredAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${requiredAmount.toLocaleString()} but only have ₹${walletData.total_balance.toLocaleString()}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const deductBalance = async (amount: number, reason: string, referenceId?: string): Promise<boolean> => {
    if (!user || !walletData) return false;

    try {
      const newBalance = walletData.total_balance - amount;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          total_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'debit',
          income_type: 'manual',
          amount: amount,
          balance_before: walletData.total_balance,
          balance_after: newBalance,
          reason: reason,
          reference_id: referenceId
        });

      if (transactionError) throw transactionError;

      // Update local state
      setWalletData(prev => prev ? { ...prev, total_balance: newBalance } : null);
      
      return true;
    } catch (error) {
      console.error('Error deducting balance:', error);
      toast({
        title: "Transaction Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  return {
    walletData,
    loading,
    checkBalance,
    deductBalance,
    refreshBalance: fetchWalletData
  };
};
