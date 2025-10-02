import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Users } from 'lucide-react';

const ForexManagementRecords = () => {
  const { toast } = useToast();
  const [forexRecords, setForexRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalProfits: 0,
    totalLosses: 0,
    openPositions: 0,
    closedPositions: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchForexRecords(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const fetchForexRecords = async () => {
    try {
      let query = supabase
        .from('forex_records')
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
      setForexRecords(data || []);
    } catch (error) {
      console.error('Error fetching forex records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch forex records",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('forex_records')
        .select('user_id, volume, profit_loss, status');

      if (error) throw error;

      const records = data || [];
      const uniqueUsers = new Set(records.map(r => r.user_id));
      
      const stats = {
        totalVolume: records.reduce((sum, r) => sum + (r.volume || 0), 0),
        totalProfits: records.filter(r => r.profit_loss > 0).reduce((sum, r) => sum + r.profit_loss, 0),
        totalLosses: records.filter(r => r.profit_loss < 0).reduce((sum, r) => sum + Math.abs(r.profit_loss), 0),
        openPositions: records.filter(r => r.status === 'open').length,
        closedPositions: records.filter(r => r.status === 'closed').length,
        totalUsers: uniqueUsers.size
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (recordId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('forex_records')
        .update({ 
          status: newStatus,
          closed_at: newStatus === 'closed' ? new Date().toISOString() : null,
          close_reason: newStatus === 'closed' ? 'Admin action' : null
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Trade status updated to ${newStatus}`,
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update trade status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'closed': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getPositionTypeBadge = (type: string) => {
    return type === 'buy' 
      ? <Badge className="bg-green-500/20 text-green-400">BUY</Badge>
      : <Badge className="bg-red-500/20 text-red-400">SELL</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.totalVolume.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm">Total Profits</p>
                <p className="text-2xl font-bold text-white">
                  +${stats.totalProfits.toFixed(2)}
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
                <p className="text-red-400 text-sm">Total Losses</p>
                <p className="text-2xl font-bold text-white">
                  -${stats.totalLosses.toFixed(2)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm">Open Positions</p>
                <p className="text-2xl font-bold text-white">{stats.openPositions}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm">Closed Positions</p>
                <p className="text-2xl font-bold text-white">{stats.closedPositions}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forex Trading Records */}
      <Card>
        <CardHeader>
          <CardTitle>Forex Trading Records</CardTitle>
          <CardDescription>Monitor and manage all forex trading records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Filter by Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Leverage</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : forexRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center">No records found</TableCell>
                  </TableRow>
                ) : (
                  forexRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.users?.email || 'Unknown'}
                      </TableCell>
                      <TableCell>{record.pair_symbol}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.order_type}</Badge>
                      </TableCell>
                      <TableCell>{getPositionTypeBadge(record.position_type)}</TableCell>
                      <TableCell>{record.volume}</TableCell>
                      <TableCell>${record.entry_price?.toFixed(4)}</TableCell>
                      <TableCell>
                        ${record.current_price?.toFixed(4) || '-'}
                      </TableCell>
                      <TableCell>{record.leverage}x</TableCell>
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
                      <TableCell>{formatDate(record.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {record.status === 'open' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(record.id, 'closed')}
                            >
                              Close
                            </Button>
                          )}
                          {record.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleStatusUpdate(record.id, 'open')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleStatusUpdate(record.id, 'cancelled')}
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

export default ForexManagementRecords;