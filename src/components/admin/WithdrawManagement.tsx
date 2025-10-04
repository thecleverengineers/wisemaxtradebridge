import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface WithdrawalRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  category?: string;
  network?: string;
  to_address?: string;
  notes?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface WithdrawalActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const WithdrawManagement = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      console.log('Current user ID:', user.id);

      // Check if user has admin or super_admin role
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'super_admin']);

      console.log('User roles:', roleData);

      if (error) {
        console.error('Error checking user role:', error);
        return;
      }

      if (roleData && roleData.length > 0) {
        setUserRole(roleData[0].role);
        console.log('User role set to:', roleData[0].role);
      } else {
        console.error('User does not have admin or super_admin role');
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to manage withdrawals',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error in checkUserRole:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          amount,
          currency,
          status,
          type,
          category,
          network,
          to_address,
          notes,
          created_at
        `)
        .eq('type', 'withdrawal')
        .eq('category', 'withdrawal')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user emails for each withdrawal
      const withdrawalsWithUsers = await Promise.all(
        (data || []).map(async (withdrawal) => {
          const { data: userData } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', withdrawal.user_id)
            .maybeSingle();

          return {
            ...withdrawal,
            user_email: userData?.email,
            user_name: userData?.name,
          };
        })
      );

      setWithdrawals(withdrawalsWithUsers);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch withdrawal requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserRole();
    fetchWithdrawals();
  }, []);

  const handleApprove = async (withdrawal: WithdrawalRecord) => {
    try {
      setProcessingId(withdrawal.id);

      console.log('Approving withdrawal:', withdrawal.id);

      // Call secure database function to approve withdrawal
      const { data, error } = await supabase.rpc('approve_withdrawal', {
        p_transaction_id: withdrawal.id
      });

      console.log('RPC Response - data:', data);
      console.log('RPC Response - error:', error);

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned from RPC call');
        throw new Error('No response from server');
      }

      const result = data as unknown as WithdrawalActionResponse;
      console.log('Parsed result:', result);
      
      if (!result.success) {
        console.error('Operation failed:', result.error);
        throw new Error(result.error || 'Failed to approve withdrawal');
      }

      toast({
        title: 'Success',
        description: result.message || 'Withdrawal approved successfully',
      });

      await fetchWithdrawals();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve withdrawal';
      console.error('Final error message:', errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (withdrawal: WithdrawalRecord) => {
    try {
      setProcessingId(withdrawal.id);

      console.log('Rejecting withdrawal:', withdrawal.id);

      // Call secure database function to reject withdrawal
      const { data, error } = await supabase.rpc('reject_withdrawal', {
        p_transaction_id: withdrawal.id
      });

      console.log('RPC Response - data:', data);
      console.log('RPC Response - error:', error);

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned from RPC call');
        throw new Error('No response from server');
      }

      const result = data as unknown as WithdrawalActionResponse;
      console.log('Parsed result:', result);
      
      if (!result.success) {
        console.error('Operation failed:', result.error);
        throw new Error(result.error || 'Failed to reject withdrawal');
      }

      toast({
        title: 'Success',
        description: result.message || 'Withdrawal rejected successfully',
      });

      await fetchWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject withdrawal';
      console.error('Final error message:', errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page. Please contact an administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>Process user withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Wallet/Account</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No withdrawal requests found
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{withdrawal.user_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{withdrawal.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {withdrawal.amount} {withdrawal.currency}
                    </TableCell>
                    <TableCell>{withdrawal.network || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {withdrawal.to_address || 'N/A'}
                    </TableCell>
                    <TableCell>{format(new Date(withdrawal.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(withdrawal.status)}>
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {withdrawal.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(withdrawal)}
                            disabled={processingId === withdrawal.id}
                          >
                            {processingId === withdrawal.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(withdrawal)}
                            disabled={processingId === withdrawal.id}
                          >
                            {processingId === withdrawal.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1" />
                            )}
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawManagement;