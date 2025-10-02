import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Users, TrendingUp, Clock } from 'lucide-react';

const USDTStakingManagement = () => {
  const { toast } = useToast();
  const [stakingRecords, setStakingRecords] = useState<any[]>([]);
  const [stakingPlans, setStakingPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStaked: 0,
    activeStakes: 0,
    totalEarned: 0,
    totalUsers: 0
  });
  
  const [newPlan, setNewPlan] = useState({
    name: '',
    apy: '',
    minAmount: '',
    duration: '',
    type: 'locked'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStakingRecords(),
      fetchStakingPlans(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const fetchStakingRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('usdtstaking_records')
        .select(`
          *,
          users (
            email,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setStakingRecords(data || []);
    } catch (error) {
      console.error('Error fetching staking records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staking records",
        variant: "destructive",
      });
    }
  };

  const fetchStakingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('staking_plans')
        .select('*')
        .order('duration_days', { ascending: true });

      if (error) throw error;
      setStakingPlans(data || []);
    } catch (error) {
      console.error('Error fetching staking plans:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('usdtstaking_records')
        .select('user_id, amount, total_earned, status');

      if (error) throw error;

      const activeRecords = data?.filter(r => r.status === 'active') || [];
      const uniqueUsers = new Set(data?.map(r => r.user_id) || []);
      
      setStats({
        totalStaked: activeRecords.reduce((sum, r) => sum + (r.amount || 0), 0),
        activeStakes: activeRecords.length,
        totalEarned: data?.reduce((sum, r) => sum + (r.total_earned || 0), 0) || 0,
        totalUsers: uniqueUsers.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.apy || !newPlan.minAmount || !newPlan.duration) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('staking_plans')
        .insert({
          name: newPlan.name,
          apy: parseFloat(newPlan.apy),
          min_amount: parseFloat(newPlan.minAmount),
          duration_days: parseInt(newPlan.duration),
          type: newPlan.type,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staking plan created successfully",
      });

      setNewPlan({
        name: '',
        apy: '',
        minAmount: '',
        duration: '',
        type: 'locked'
      });
      
      fetchStakingPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: "Failed to create staking plan",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (recordId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('usdtstaking_records')
        .update({ status: newStatus })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Status updated to ${newStatus}`,
      });
      
      fetchStakingRecords();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'withdrawn': return 'outline';
      case 'expired': return 'destructive';
      default: return 'default';
    }
  };
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm">Total Staked</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.totalStaked.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm">Active Stakes</p>
                <p className="text-2xl font-bold text-white">{stats.activeStakes}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm">Total Earned</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.totalEarned.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Plan */}
      <Card>
        <CardHeader>
          <CardTitle>USDT Staking Plans</CardTitle>
          <CardDescription>Create and manage staking plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan Name</Label>
                <Input 
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  placeholder="e.g., Premium Staking" 
                />
              </div>
              <div>
                <Label>APY (%)</Label>
                <Input 
                  type="number" 
                  value={newPlan.apy}
                  onChange={(e) => setNewPlan({...newPlan, apy: e.target.value})}
                  placeholder="12.5" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Stake</Label>
                <Input 
                  type="number" 
                  value={newPlan.minAmount}
                  onChange={(e) => setNewPlan({...newPlan, minAmount: e.target.value})}
                  placeholder="100" 
                />
              </div>
              <div>
                <Label>Lock Period (days)</Label>
                <Input 
                  type="number" 
                  value={newPlan.duration}
                  onChange={(e) => setNewPlan({...newPlan, duration: e.target.value})}
                  placeholder="30" 
                />
              </div>
            </div>
            <Button onClick={handleCreatePlan}>Create Staking Plan</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>APY</TableHead>
                <TableHead>Min Stake</TableHead>
                <TableHead>Lock Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stakingPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.apy}%</TableCell>
                  <TableCell>${plan.min_amount}</TableCell>
                  <TableCell>
                    {plan.type === 'flexible' ? 'Flexible' : `${plan.duration_days} days`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.type === 'flexible' ? 'secondary' : 'default'}>
                      {plan.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? 'default' : 'destructive'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Active Stakes Records */}
      <Card>
        <CardHeader>
          <CardTitle>Staking Records</CardTitle>
          <CardDescription>Monitor and manage user staking records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>APY</TableHead>
                <TableHead>Stake Date</TableHead>
                <TableHead>Maturity Date</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stakingRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.users?.email || 'Unknown'}</TableCell>
                  <TableCell>{record.plan_name}</TableCell>
                  <TableCell>
                    <Badge variant={record.plan_type === 'flexible' ? 'secondary' : 'default'}>
                      {record.plan_type}
                    </Badge>
                  </TableCell>
                  <TableCell>${record.amount}</TableCell>
                  <TableCell>{record.apy}%</TableCell>
                  <TableCell>{formatDate(record.stake_date)}</TableCell>
                  <TableCell>
                    {record.maturity_date ? formatDate(record.maturity_date) : 'N/A'}
                  </TableCell>
                  <TableCell>${record.total_earned?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {record.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateStatus(record.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus(record.id, 'withdrawn')}
                      >
                        Withdraw
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default USDTStakingManagement;