import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, CheckCircle, XCircle, Clock, TrendingUp, Check, X } from 'lucide-react';

interface DepositRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  network: string;
  tx_hash: string | null;
  from_address: string | null;
  to_address: string;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

const DepositManagement = () => {
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchDeposits();
    
    // Set up real-time subscription for deposit updates
    const channel = supabase
      .channel('deposit-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deposit_transactions'
        },
        (payload) => {
          console.log('Deposit transaction changed:', payload);
          fetchDeposits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('deposit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user details for each deposit
      const depositsWithUsers = await Promise.all(
        (data || []).map(async (deposit) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', deposit.user_id)
            .maybeSingle();

          return {
            ...deposit,
            user_email: userData?.email,
            user_name: userData?.name,
          };
        })
      );

      setDeposits(depositsWithUsers);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (deposit: DepositRecord) => {
    try {
      // Get current wallet balance first
      const { data: walletData, error: fetchError } = await supabase
        .from('wallets')
        .select('balance, total_deposited')
        .eq('user_id', deposit.user_id)
        .eq('currency', 'USDT')
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentBalance = walletData?.balance || 0;
      const totalDeposited = walletData?.total_deposited || 0;
      const newBalance = Number(currentBalance) + Number(deposit.amount);
      const newTotalDeposited = Number(totalDeposited) + Number(deposit.amount);

      // Update user's wallet balance and total deposited
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          total_deposited: newTotalDeposited,
          last_transaction_at: new Date().toISOString()
        })
        .eq('user_id', deposit.user_id)
        .eq('currency', 'USDT');

      if (walletError) throw walletError;

      // Update deposit transaction status
      const { error: txError } = await supabase
        .from('deposit_transactions')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', deposit.id);

      if (txError) throw txError;

      // Create transaction record for history
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: deposit.user_id,
          type: 'credit',
          category: 'deposit',
          amount: deposit.amount,
          currency: deposit.currency,
          status: 'completed',
          reference_id: deposit.tx_hash,
          balance_after: newBalance,
          notes: `Deposit confirmed - Network: ${deposit.network}, TxHash: ${deposit.tx_hash || 'N/A'}`
        });

      if (transactionError) throw transactionError;

      toast({
        title: 'Deposit Approved',
        description: `Successfully credited ${deposit.amount} ${deposit.currency} to ${deposit.user_email}'s wallet`,
      });

      fetchDeposits();
    } catch (error: any) {
      console.error('Error approving deposit:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve deposit',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (deposit: DepositRecord) => {
    try {
      const { error } = await supabase
        .from('deposit_transactions')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', deposit.id);

      if (error) throw error;

      toast({
        title: 'Deposit Rejected',
        description: `Rejected deposit of ${deposit.amount} ${deposit.currency} for ${deposit.user_email}`,
        variant: 'destructive',
      });

      fetchDeposits();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredDeposits = deposits.filter(
    (deposit) =>
      deposit.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.from_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.currency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: deposits.length,
    pending: deposits.filter((d) => d.status === 'pending').length,
    confirmed: deposits.filter((d) => d.status === 'confirmed').length,
    rejected: deposits.filter((d) => d.status === 'rejected').length,
    totalAmount: deposits
      .filter((d) => d.status === 'confirmed')
      .reduce((sum, d) => sum + Number(d.amount), 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Deposit Management</h2>
        <p className="text-muted-foreground">
          View and manage all deposit transactions
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit Transactions</CardTitle>
          <CardDescription>All deposit records from users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by email, tx hash, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchDeposits} variant="outline">
              Refresh
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>From Address</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No deposits found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{deposit.user_name || 'N/A'}</span>
                          <span className="text-sm text-muted-foreground">
                            {deposit.user_email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(deposit.amount).toFixed(2)} {deposit.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{deposit.network}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">
                          {deposit.from_address
                            ? `${deposit.from_address.substring(0, 6)}...${deposit.from_address.substring(deposit.from_address.length - 4)}`
                            : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">
                          {deposit.tx_hash
                            ? `${deposit.tx_hash.substring(0, 8)}...`
                            : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(deposit.status)}>
                          {deposit.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(deposit.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(deposit.created_at).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {deposit.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(deposit)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(deposit)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground capitalize">
                            {deposit.status}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositManagement;
