import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface BinaryRecord {
  id: string;
  user_id: string;
  asset: string;
  direction: string;
  amount: number;
  entry_price: number;
  exit_price: number | null;
  profit_loss: number;
  status: string;
  duration: number;
  expiry_time: string;
  created_at: string;
  settled_at: string | null;
  users?: {
    name: string;
    email: string;
  };
}

const BinaryRecordsManagement = () => {
  const [records, setRecords] = useState<BinaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('binary_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user details separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);
        
        const recordsWithUsers = data.map(record => ({
          ...record,
          users: usersMap.get(record.user_id) || undefined
        }));

        setRecords(recordsWithUsers);
      } else {
        setRecords(data || []);
      }
    } catch (error) {
      console.error('Error fetching binary records:', error);
      toast({
        title: "Error",
        description: "Failed to load binary records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForceResult = async (recordId: string, result: 'win' | 'loss') => {
    try {
      const record = records.find(r => r.id === recordId);
      if (!record) return;

      const profitLoss = result === 'win' ? record.amount * 0.8 : -record.amount;

      const { error } = await supabase
        .from('binary_records')
        .update({ 
          status: result === 'win' ? 'won' : 'lost',
          exit_price: record.entry_price * (result === 'win' ? 1.01 : 0.99),
          profit_loss: profitLoss,
          settled_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Trade forced to ${result}`,
      });

      fetchRecords();
    } catch (error) {
      console.error('Error updating trade:', error);
      toast({
        title: "Error",
        description: "Failed to update trade result",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      won: "default",
      lost: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const stats = {
    total: records.length,
    pending: records.filter(r => r.status === 'pending').length,
    won: records.filter(r => r.status === 'won').length,
    lost: records.filter(r => r.status === 'lost').length,
    totalVolume: records.reduce((sum, r) => sum + r.amount, 0),
    totalProfit: records.reduce((sum, r) => sum + r.profit_loss, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Trades</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Won / Lost</CardDescription>
            <CardTitle className="text-3xl">
              <span className="text-green-600">{stats.won}</span> / 
              <span className="text-red-600"> {stats.lost}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total P&L</CardDescription>
            <CardTitle className={`text-3xl ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.totalProfit.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Binary Trading Records</CardTitle>
              <CardDescription>Manage all binary options trades</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stake</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{record.users?.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{record.users?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{record.asset}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {record.direction === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="uppercase">{record.direction}</span>
                        </div>
                      </TableCell>
                      <TableCell>${record.amount.toFixed(2)}</TableCell>
                      <TableCell className="font-mono">{record.entry_price.toFixed(4)}</TableCell>
                      <TableCell className="font-mono">
                        {record.exit_price ? record.exit_price.toFixed(4) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={record.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${record.profit_loss.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(record.created_at), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {record.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleForceResult(record.id, 'win')}
                            >
                              Win
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleForceResult(record.id, 'loss')}
                            >
                              Lose
                            </Button>
                          </div>
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

export default BinaryRecordsManagement;
