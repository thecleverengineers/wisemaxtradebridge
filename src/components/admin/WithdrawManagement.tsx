import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface WithdrawalRecord {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  network: string;
  wallet_address: string;
  admin_note?: string;
  created_at: string;
  processed_at?: string;
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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRecord | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const { toast } = useToast();

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      console.log('Current user ID:', user.id);

      // Check if user has admin, superadmin, or super-admin role
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'superadmin', 'super-admin']);

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
        .from('withdrawal_requests')
        .select(`
          id,
          user_id,
          amount,
          status,
          network,
          wallet_address,
          admin_note,
          created_at,
          processed_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user emails for each withdrawal
      const withdrawalsWithUsers = await Promise.all(
        (data || []).map(async (withdrawal) => {
          const { data: userData } = await supabase
            .from('profiles')
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
    setProcessingId(withdrawal.id);
    
    try {
      const { data, error } = await supabase.rpc('approve_withdrawal', {
        withdrawal_id: withdrawal.id
      });
      
      if (error) throw error;
      
      const result = data as unknown as WithdrawalActionResponse;
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve withdrawal');
      }
      
      toast({
        title: 'Success',
        description: result.message || 'Withdrawal approved successfully',
      });
      
      await fetchWithdrawals();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve withdrawal',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (withdrawal: WithdrawalRecord) => {
    setSelectedWithdrawal(withdrawal);
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!selectedWithdrawal) return;
    
    setProcessingId(selectedWithdrawal.id);
    
    try {
      const { data, error } = await supabase.rpc('reject_withdrawal', {
        withdrawal_id: selectedWithdrawal.id,
        note: rejectNote || null
      });
      
      if (error) throw error;
      
      const result = data as unknown as WithdrawalActionResponse;
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject withdrawal');
      }
      
      toast({
        title: 'Success',
        description: result.message || 'Withdrawal rejected successfully',
      });
      
      setRejectDialogOpen(false);
      setRejectNote('');
      setSelectedWithdrawal(null);
      await fetchWithdrawals();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject withdrawal',
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
                <TableHead>Network</TableHead>
                <TableHead>Wallet Address</TableHead>
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
                      {withdrawal.amount} USDT
                    </TableCell>
                    <TableCell>{withdrawal.network || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {withdrawal.wallet_address || 'N/A'}
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
                      {withdrawal.status === 'rejected' && withdrawal.admin_note && (
                        <div className="text-sm text-muted-foreground">
                          Note: {withdrawal.admin_note}
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

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Add a note explaining why this withdrawal is being rejected (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectNote('');
                  setSelectedWithdrawal(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={!!processingId}
              >
                {processingId ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                Confirm Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawManagement;