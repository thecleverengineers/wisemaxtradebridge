import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';

interface ROIInvestment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  start_date: string;
  end_date: string;
  total_roi_earned: number;
  status: string;
  last_payout_date: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
  investment_plans?: {
    name: string;
    daily_roi: number;
    duration_days: number;
  };
}

const ROIInvestmentManagement = () => {
  const [investments, setInvestments] = useState<ROIInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchInvestments();
  }, [statusFilter]);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user and plan details separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(i => i.user_id))];
        const planIds = [...new Set(data.map(i => i.plan_id))];

        const [usersResult, plansResult] = await Promise.all([
          supabase.from('profiles').select('id, name, email').in('id', userIds),
          supabase.from('investment_plans').select('id, name, daily_roi, duration_days').in('id', planIds)
        ]);

        const usersMap = new Map(usersResult.data?.map(u => [u.id, u]) || []);
        const plansMap = new Map(plansResult.data?.map(p => [p.id, p]) || []);

        const investmentsWithDetails = data.map(investment => ({
          ...investment,
          users: usersMap.get(investment.user_id),
          investment_plans: plansMap.get(investment.plan_id)
        }));

        setInvestments(investmentsWithDetails);
      } else {
        setInvestments(data || []);
      }
    } catch (error) {
      console.error('Error fetching ROI investments:', error);
      toast({
        title: "Error",
        description: "Failed to load ROI investments",
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

  const stats = {
    total: investments.length,
    active: investments.filter(i => i.status === 'active').length,
    completed: investments.filter(i => i.status === 'completed').length,
    totalInvested: investments.reduce((sum, i) => sum + i.amount, 0),
    totalEarned: investments.reduce((sum, i) => sum + i.total_roi_earned, 0),
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
            <CardDescription>Total Investments</CardDescription>
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
            <CardDescription>Total Invested</CardDescription>
            <CardTitle className="text-3xl">${stats.totalInvested.toLocaleString()}</CardTitle>
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

      {/* Investments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ROI Investment Records</CardTitle>
              <CardDescription>Manage all ROI investments</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Investments</SelectItem>
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
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Daily ROI</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Last Payout</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No investments found
                    </TableCell>
                  </TableRow>
                ) : (
                  investments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{investment.users?.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{investment.users?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PiggyBank className="h-4 w-4 text-primary" />
                          <span className="font-medium">{investment.investment_plans?.name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">${investment.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">
                        {investment.investment_plans?.daily_roi || 0}%
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${investment.total_roi_earned.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(investment.start_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(investment.end_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {investment.last_payout_date 
                          ? format(new Date(investment.last_payout_date), 'MMM dd, yyyy')
                          : 'Never'}
                      </TableCell>
                      <TableCell>{getStatusBadge(investment.status)}</TableCell>
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

export default ROIInvestmentManagement;
