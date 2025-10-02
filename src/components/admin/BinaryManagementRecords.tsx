import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, Users } from 'lucide-react';

const BinaryManagementRecords = () => {
  const { toast } = useToast();
  const [binaryRecords, setBinaryRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalStaked: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    totalProfits: 0,
    totalLossAmount: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchBinaryRecords(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const fetchBinaryRecords = async () => {
    try {
      let query = supabase
        .from('binary_records')
        .select(`
          *,
          users (
            email,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBinaryRecords(data || []);
    } catch (error) {
      console.error('Error fetching binary records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch binary records",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('binary_records')
        .select('user_id, stake_amount, profit_loss, status')
        .eq('is_demo', false);

      if (error) throw error;

      const records = data || [];
      const uniqueUsers = new Set(records.map(r => r.user_id));
      const wonTrades = records.filter(r => r.status === 'won');
      const lostTrades = records.filter(r => r.status === 'lost');
      
      const stats = {
        totalTrades: records.length,
        totalStaked: records.reduce((sum, r) => sum + (r.stake_amount || 0), 0),
        totalWins: wonTrades.length,
        totalLosses: lostTrades.length,
        winRate: records.length > 0 
          ? ((wonTrades.length / (wonTrades.length + lostTrades.length)) * 100) || 0
          : 0,
        totalProfits: wonTrades.reduce((sum, r) => sum + (r.profit_loss || 0), 0),
        totalLossAmount: lostTrades.reduce((sum, r) => sum + Math.abs(r.profit_loss || 0), 0),
        activeUsers: uniqueUsers.size
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleForceResult = async (recordId: string, result: 'WIN' | 'LOSE') => {
    try {
      const { error } = await supabase
        .from('binary_records')
        .update({ 
          admin_forced_result: result,
          status: result === 'WIN' ? 'won' : 'lost',
          settled_at: new Date().toISOString(),
          profit_loss: result === 'WIN' 
            ? (binaryRecords.find(r => r.id === recordId)?.stake_amount || 0) * 0.8
            : -(binaryRecords.find(r => r.id === recordId)?.stake_amount || 0)
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Trade forced to ${result}`,
      });
      
      fetchData();
    } catch (error) {
      console.error('Error forcing result:', error);
      toast({
        title: "Error",
        description: "Failed to force trade result",
        variant: "destructive",
      });
    }
  };

  const handleCancelTrade = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('binary_records')
        .update({ 
          status: 'cancelled',
          settled_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trade cancelled",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error cancelling trade:', error);
      toast({
        title: "Error",
        description: "Failed to cancel trade",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'won': return 'default';
      case 'lost': return 'destructive';
      case 'expired': return 'secondary';
      case 'cancelled': return 'secondary';
      default: return 'default';
    }
  };

  const getTradeTypeBadge = (type: string) => {
    return type === 'CALL' 
      ? <Badge className="bg-green-500/20 text-green-400">CALL</Badge>
      : <Badge className="bg-red-500/20 text-red-400">PUT</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm">Total Trades</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalTrades}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm">Total Staked</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.totalStaked.toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm">Wins</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalWins}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm">Losses</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalLosses}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm">Win Rate</p>
                <p className="text-2xl font-bold text-white">
                  {stats.winRate.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm">Profits</p>
                <p className="text-2xl font-bold text-white">
                  +${stats.totalProfits.toFixed(0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm">Loss Amount</p>
                <p className="text-2xl font-bold text-white">
                  -${stats.totalLossAmount.toFixed(0)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
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

      {/* Binary Trading Records */}
      <Card>
        <CardHeader>
          <CardTitle>Binary Trading Records</CardTitle>
          <CardDescription>Monitor and manage all binary options trades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stake</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Exit Price</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Demo</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : binaryRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center">No records found</TableCell>
                  </TableRow>
                ) : (
                  binaryRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.users?.email || 'Unknown'}
                      </TableCell>
                      <TableCell>{record.asset_pair}</TableCell>
                      <TableCell>{getTradeTypeBadge(record.trade_type)}</TableCell>
                      <TableCell>${record.stake_amount}</TableCell>
                      <TableCell>{record.entry_price?.toFixed(4)}</TableCell>
                      <TableCell>
                        {record.exit_price?.toFixed(4) || '-'}
                      </TableCell>
                      <TableCell>{formatDate(record.expiry_time)}</TableCell>
                      <TableCell>
                        <span className={record.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {record.profit_loss >= 0 ? '+' : ''}${record.profit_loss?.toFixed(2) || '0.00'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.is_demo ? 
                          <Badge variant="outline">Demo</Badge> : 
                          <Badge variant="default">Live</Badge>
                        }
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
                                onClick={() => handleForceResult(record.id, 'WIN')}
                              >
                                Win
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-400"
                                onClick={() => handleForceResult(record.id, 'LOSE')}
                              >
                                Lose
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleCancelTrade(record.id)}
                              >
                                Cancel
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
        </CardContent>
      </Card>
    </div>
  );
};

export default BinaryManagementRecords;