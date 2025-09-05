
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { supabaseUntyped as supabase } from '@/integrations/supabase/untyped';
import { useToast } from '@/hooks/use-toast';

interface Investment {
  id: string;
  user_id: string;
  amount: number;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'completed' | 'cancelled' | string;
  returns?: number;
  daily_roi_amount?: number;
  total_roi_expected?: number;
  roi_credited_days?: number;
  users?: {
    name?: string;
    email?: string;
  };
  investment_plans?: {
    name?: string;
    daily_roi?: number;
    duration_days?: number;
    roi_percentage?: number;
  };
}

interface InvestmentPlan {
  id: string;
  name: string;
  description?: string;
  min_amount: number;
  max_amount?: number;
  duration_days: number;
  is_active: boolean;
  daily_roi?: number;
  total_return_percent?: number;
  roi_percentage?: number;
}

export const InvestmentManagement = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchInvestments();
    fetchPlans();
  }, []);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          users (name),
          investment_plans (name, daily_roi, duration_days)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch investments",
        variant: "destructive",
      });
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInvestmentStatus = async (investmentId: string, status: 'active' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('investments')
        .update({ status })
        .eq('id', investmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Investment status updated to ${status}`,
      });
      
      fetchInvestments();
    } catch (error) {
      console.error('Error updating investment:', error);
      toast({
        title: "Error",
        description: "Failed to update investment status",
        variant: "destructive",
      });
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('investment_plans')
        .update({ is_active: !isActive })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Plan ${!isActive ? 'activated' : 'deactivated'}`,
      });
      
      fetchPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update plan status",
        variant: "destructive",
      });
    }
  };

  const filteredInvestments = investments.filter(investment =>
    investment.users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investment.investment_plans?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Investment Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      <Tabs defaultValue="investments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="investments">Active Investments</TabsTrigger>
          <TabsTrigger value="plans">Investment Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="investments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{investments.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {investments.filter(i => i.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${investments.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ROI Distributed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ${investments.reduce((sum, i) => sum + (i.roi_credited_days * i.daily_roi_amount), 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Investment List</CardTitle>
              <CardDescription>Monitor and manage all user investments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search investments..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Daily ROI</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestments.map((investment) => (
                      <TableRow key={investment.id}>
                        <TableCell>
                          <div className="font-medium">{investment.users?.name}</div>
                        </TableCell>
                        <TableCell>{investment.investment_plans?.name}</TableCell>
                        <TableCell>${investment.amount.toLocaleString()}</TableCell>
                        <TableCell>${investment.daily_roi_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {investment.roi_credited_days} / {investment.investment_plans?.duration_days} days
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${(investment.roi_credited_days / investment.investment_plans?.duration_days) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(investment.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {investment.status === 'active' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateInvestmentStatus(investment.id, 'completed')}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateInvestmentStatus(investment.id, 'cancelled')}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Plans</CardTitle>
              <CardDescription>Manage available investment plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <Card key={plan.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Min Amount:</span>
                        <span className="font-medium">${plan.min_amount.toLocaleString()}</span>
                      </div>
                      {plan.max_amount && (
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Max Amount:</span>
                          <span className="font-medium">${plan.max_amount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Daily ROI:</span>
                        <span className="font-medium text-green-600">{plan.daily_roi}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Duration:</span>
                        <span className="font-medium">{plan.duration_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Total Return:</span>
                        <span className="font-medium text-blue-600">{plan.total_return_percent}%</span>
                      </div>
                      <div className="pt-4">
                        <Button
                          onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                          variant={plan.is_active ? "destructive" : "default"}
                          className="w-full"
                        >
                          {plan.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Investment Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>This Month</span>
                    <span className="font-bold text-green-600">+15.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>This Quarter</span>
                    <span className="font-bold text-green-600">+45.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>This Year</span>
                    <span className="font-bold text-green-600">+120.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Plan Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.slice(0, 3).map((plan) => (
                    <div key={plan.id} className="flex justify-between items-center">
                      <span>{plan.name}</span>
                      <span className="font-bold">{plan.daily_roi}% daily</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
