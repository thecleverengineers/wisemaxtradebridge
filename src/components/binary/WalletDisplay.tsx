import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  notes: string;
  created_at: string;
  status: string;
}

export const WalletDisplay: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('wallet-balance', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      setBalance(data.balance || 0);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      // Fallback to direct database query
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .eq('currency', 'USDT')
        .single();

      if (wallet) {
        setBalance(wallet.balance);
      }

      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'binary_trade')
        .order('created_at', { ascending: false })
        .limit(10);

      if (txns) {
        setTransactions(txns);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();

    // Subscribe to wallet changes
    if (user) {
      const channel = supabase
        .channel('wallet-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchWalletData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse text-primary text-center">Loading wallet...</div>
        </CardContent>
      </Card>
    );
  }

  const parseTradeResult = (notes: string) => {
    if (notes?.includes('WIN')) return 'WIN';
    if (notes?.includes('LOSE')) return 'LOSE';
    return null;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold text-primary">${balance.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary/50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const result = parseTradeResult(tx.notes);
                  return (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        {result === 'WIN' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : result === 'LOSE' ? (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        ) : (
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{tx.notes || 'Binary Trade'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-semibold",
                          result === 'WIN' ? "text-green-500" : result === 'LOSE' ? "text-red-500" : "text-foreground"
                        )}>
                          {result === 'WIN' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </p>
                        {result && (
                          <Badge 
                            variant={result === 'WIN' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {result}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};