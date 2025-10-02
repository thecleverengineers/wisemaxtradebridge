import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, ArrowUpRight, DollarSign, Clock, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const WalletManagementRecords = () => {
  const { toast } = useToast();
  const [transactionRecords, setTransactionRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    completedTransactions: 0,
    totalFees: 0,
    activeUsers: 0,
    totalVolume: 0
  });

  useEffect(() => {
    fetchData();
  }, [filterType, filterStatus, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTransactionRecords(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const fetchTransactionRecords = async () => {
    try {
      let query = supabase
        .from('transactions_records')
        .select(`
          *,
          users (
            email,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterType !== 'all') {
        query = query.eq('order_type', filterType);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactionRecords(data || []);
    } catch (error) {
      console.error('Error fetching transaction records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction records",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions_records')
        .select('user_id, amount, order_type, status, fee');

      if (error) throw error;

      const records = data || [];
      const uniqueUsers = new Set(records.map(r => r.user_id));
      
      const stats = {
        totalDeposits: records.filter(r => r.order_type === 'deposit' && r.status === 'completed')
          .reduce((sum, r) => sum + (r.amount || 0), 0),
        totalWithdrawals: records.filter(r => r.order_type === 'withdraw' && r.status === 'completed')
          .reduce((sum, r) => sum + (r.amount || 0), 0),
        pendingDeposits: records.filter(r => r.order_type === 'deposit' && r.status === 'pending').length,
        pendingWithdrawals: records.filter(r => r.order_type === 'withdraw' && r.status === 'pending').length,
        completedTransactions: records.filter(r => r.status === 'completed').length,
        totalFees: records.reduce((sum, r) => sum + (r.fee || 0), 0),
        activeUsers: uniqueUsers.size,
        totalVolume: records.filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + (r.amount || 0), 0)
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApproveTransaction = async (recordId: string, recordType: string) => {
    try {
      const { error } = await supabase
        .from('transactions_records')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          admin_notes: 'Approved by admin'
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${recordType === 'deposit' ? 'Deposit' : 'Withdrawal'} approved successfully`,
      });
      
      fetchData();
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({
        title: "Error",
        description: "Failed to approve transaction",
        variant: "destructive",
      });
    }
  };

  const handleRejectTransaction = async (recordId: string, reason: string = 'Admin rejection') => {
    try {
      const { error } = await supabase
        .from('transactions_records')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
          admin_notes: 'Rejected by admin'
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction rejected",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'outline';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      case 'rejected': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'default';
    }
  };

  const getOrderTypeBadge = (type: string) => {
    return type === 'deposit' 
      ? <Badge className="bg-green-500/20 text-green-400">Deposit</Badge>
      : <Badge className="bg-red-500/20 text-red-400">Withdraw</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm">Total Deposits</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.totalDeposits.toFixed(0)}
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm">Total Withdrawals</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.totalWithdrawals.toFixed(0)}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm">Pending Deposits</p>
                <p className="text-2xl font-bold text-white">
                  {stats.pendingDeposits}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-400 text-sm">Pending Withdrawals</p>
                <p className="text-2xl font-bold text-white">
                  {stats.pendingWithdrawals}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white">
                  {stats.completedTransactions}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm">Total Fees</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.totalFees.toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.totalVolume.toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">
                  {stats.activeUsers}
                </p>
              </div>
              <Users className="h-8 w-8 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Records */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Transaction Records</CardTitle>
          <CardDescription>Manage deposits and withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdraw">Withdrawals</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Address/Hash</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : transactionRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center">No records found</TableCell>
                      </TableRow>
                    ) : (
                      transactionRecords
                        .filter(record => activeTab === 'all' || 
                          (activeTab === 'pending' && record.status === 'pending') ||
                          (activeTab === 'completed' && record.status === 'completed'))
                        .map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.users?.email || 'Unknown'}
                            </TableCell>
                            <TableCell>{getOrderTypeBadge(record.order_type)}</TableCell>
                            <TableCell>${record.amount}</TableCell>
                            <TableCell>{record.currency}</TableCell>
                            <TableCell>{record.network || 'N/A'}</TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {record.order_type === 'deposit' 
                                ? record.transaction_hash 
                                : record.wallet_address || 'N/A'}
                            </TableCell>
                            <TableCell>${record.fee || 0}</TableCell>
                            <TableCell>${record.net_amount || record.amount}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(record.status)}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(record.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {record.status === 'pending' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-green-400"
                                      onClick={() => handleApproveTransaction(record.id, record.order_type)}
                                    >
                                      Approve
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => handleRejectTransaction(record.id)}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletManagementRecords;