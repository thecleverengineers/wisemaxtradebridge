import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface USDTStaking {
  id: string;
  user_id: string;
  amount: number;
  plan_type: string;
  apy: number;
  duration_days: number | null;
  stake_date: string;
  maturity_date: string | null;
  last_interest_date: string;
  total_earned: number;
  status: string;
  auto_renew: boolean;
  created_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

const USDTStakingManagement = () => {
  const [stakingRecords, setStakingRecords] = useState<USDTStaking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchStakingRecords();
  }, [statusFilter]);

  const fetchStakingRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('staking_records')
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
        const userIds = [...new Set(data.map(s => s.user_id))];
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

        const recordsWithUsers = data.map(record => ({
          ...record,
          plan_type: 'flexible',
          apy: (record.daily_return_amount || 0) * 365,
          start_date: record.start_date,
          end_date: record.end_date,
          total_earned: record.total_earned || 0,
          users: usersMap.get(record.user_id)
        }));

        setStakingRecords(recordsWithUsers as any);
      } else {
        setStakingRecords([]);
      }
    } catch (error) {
      console.error('Error fetching USDT staking records:', error);
      toast({
        title: "Error",
        description: "Failed to load USDT staking records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      completed: "secondary",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const getPlanTypeBadge = (planType: string) => {
    const colors: Record<string, string> = {
      flexible: "bg-blue-500",
      locked: "bg-purple-500",
    };
    return (
      <Badge className={colors[planType] || "bg-gray-500"}>
        {planType.toUpperCase()}
      </Badge>
    );
  };

  const stats = {
    total: stakingRecords.length,
    active: stakingRecords.filter(s => s.status === 'active').length,
    completed: stakingRecords.filter(s => s.status === 'completed').length,
    totalStaked: stakingRecords.reduce((sum, s) => sum + s.amount, 0),
    totalEarned: stakingRecords.reduce((sum, s) => sum + s.total_earned, 0),
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
            <CardDescription>Total Staking Records</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Staked</CardDescription>
            <CardTitle className="text-3xl">${stats.totalStaked.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ${stats.totalEarned.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Staking Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>USDT Staking Records</CardTitle>
              <CardDescription>Manage all USDT staking records</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
                  <TableHead>Plan Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>APY</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Stake Date</TableHead>
                  <TableHead>Maturity Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Auto Renew</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stakingRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No staking records found
                    </TableCell>
                  </TableRow>
                ) : (
                  stakingRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{record.users?.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{record.users?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanTypeBadge(record.plan_type)}</TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          {record.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {record.apy}%
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${record.total_earned.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(record.stake_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.maturity_date
                          ? format(new Date(record.maturity_date), 'MMM dd, yyyy')
                          : 'Flexible'}
                      </TableCell>
                      <TableCell>
                        {record.duration_days ? `${record.duration_days} days` : 'Flexible'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.auto_renew ? 'default' : 'outline'}>
                          {record.auto_renew ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
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

export default USDTStakingManagement;
