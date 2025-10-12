import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface ForexRecord {
  id: string;
  user_id: string;
  pair_symbol: string;
  position_type: string;
  order_type: string;
  entry_price: number;
  exit_price: number | null;
  lot_size: number;
  leverage: number;
  margin_used: number;
  stop_loss: number | null;
  take_profit: number | null;
  profit_loss: number;
  commission: number;
  swap: number;
  status: string;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

const ForexRecordsManagement = () => {
  const [records, setRecords] = useState<ForexRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('forex_records')
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
          users: usersMap.get(record.user_id)
        }));

        setRecords(recordsWithUsers);
      } else {
        setRecords(data || []);
      }
    } catch (error) {
      console.error('Error fetching forex records:', error);
      toast({
        title: "Error",
        description: "Failed to load forex records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "default",
      closed: "secondary",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const stats = {
    total: records.length,
    open: records.filter(r => r.status === 'open').length,
    closed: records.filter(r => r.status === 'closed').length,
    totalVolume: records.reduce((sum, r) => sum + r.lot_size, 0),
    totalPnL: records.reduce((sum, r) => sum + r.profit_loss, 0),
    totalMargin: records.reduce((sum, r) => sum + r.margin_used, 0),
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
            <CardDescription>Total Positions</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Positions</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.open}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Margin Used</CardDescription>
            <CardTitle className="text-3xl">${stats.totalMargin.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total P&L</CardDescription>
            <CardTitle className={`text-3xl ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.totalPnL.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Forex Trading Records</CardTitle>
              <CardDescription>Manage all forex trading positions</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  <TableHead>Pair</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Exit Price</TableHead>
                  <TableHead>Lot Size</TableHead>
                  <TableHead>Leverage</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      No forex records found
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
                      <TableCell className="font-mono font-semibold">{record.pair_symbol}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {record.position_type === 'buy' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="uppercase">{record.position_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{record.entry_price.toFixed(5)}</TableCell>
                      <TableCell className="font-mono">
                        {record.exit_price ? record.exit_price.toFixed(5) : '-'}
                      </TableCell>
                      <TableCell>{record.lot_size.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">1:{record.leverage}</Badge>
                      </TableCell>
                      <TableCell>${record.margin_used.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={record.profit_loss >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          ${record.profit_loss.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span>{format(new Date(record.created_at), 'MMM dd, HH:mm')}</span>
                          {record.closed_at && (
                            <span className="text-xs text-muted-foreground">
                              Closed: {format(new Date(record.closed_at), 'MMM dd, HH:mm')}
                            </span>
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

export default ForexRecordsManagement;
