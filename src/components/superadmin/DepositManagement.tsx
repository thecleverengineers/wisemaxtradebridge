import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, RefreshCw, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface DepositTransaction {
  id: string;
  user_id: string;
  currency: string;
  amount: number;
  network: string;
  status: string;
  from_address: string | null;
  to_address: string | null;
  transaction_hash: string | null;
  confirmations: number;
  required_confirmations: number;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

const DepositManagement = () => {
  const [deposits, setDeposits] = useState<DepositTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositTransaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposit_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (depositsError) throw depositsError;

      // Fetch user emails
      const userIds = [...new Set(depositsData?.map(d => d.user_id) || [])];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      const depositsWithEmails = depositsData?.map(deposit => ({
        ...deposit,
        user_email: usersData?.find(u => u.id === deposit.user_id)?.email || 'Unknown'
      })) || [];

      setDeposits(depositsWithEmails);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch deposit transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();

    // Real-time subscription
    const channel = supabase
      .channel('deposit-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_transactions' }, () => {
        fetchDeposits();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async () => {
    if (!selectedDeposit) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('deposit_transactions')
        .update({
          status: 'completed',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', selectedDeposit.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Deposit approved successfully',
      });

      setShowApproveDialog(false);
      setAdminNotes('');
      setSelectedDeposit(null);
      fetchDeposits();
    } catch (error) {
      console.error('Error approving deposit:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve deposit',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('deposit_transactions')
        .update({
          status: 'rejected',
          rejected_by: user.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          admin_notes: adminNotes || null,
        })
        .eq('id', selectedDeposit.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Deposit rejected',
      });

      setShowRejectDialog(false);
      setAdminNotes('');
      setRejectionReason('');
      setSelectedDeposit(null);
      fetchDeposits();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject deposit',
        variant: 'destructive',
      });
    }
  };

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = 
      deposit.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.transaction_hash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.currency.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      completed: 'default',
      rejected: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deposit Management</CardTitle>
            <CardDescription>Review and manage user deposit transactions</CardDescription>
          </div>
          <Button onClick={fetchDeposits} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, tx hash, or currency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  </TableRow>
                ))
              ) : filteredDeposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No deposits found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-medium">{deposit.user_email}</TableCell>
                    <TableCell>{deposit.amount.toFixed(2)}</TableCell>
                    <TableCell>{deposit.currency}</TableCell>
                    <TableCell>{deposit.network}</TableCell>
                    <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                    <TableCell>{new Date(deposit.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDeposit(deposit);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {deposit.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setShowApproveDialog(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
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

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deposit Details</DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User Email</Label>
                  <p className="font-medium">{selectedDeposit.user_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDeposit.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-medium">{selectedDeposit.amount} {selectedDeposit.currency}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Network</Label>
                  <p className="font-medium">{selectedDeposit.network}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Transaction Hash</Label>
                  <p className="font-mono text-sm break-all">{selectedDeposit.transaction_hash || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">From Address</Label>
                  <p className="font-mono text-sm break-all">{selectedDeposit.from_address || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">To Address</Label>
                  <p className="font-mono text-sm break-all">{selectedDeposit.to_address || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Confirmations</Label>
                  <p className="font-medium">{selectedDeposit.confirmations} / {selectedDeposit.required_confirmations}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{new Date(selectedDeposit.created_at).toLocaleString()}</p>
                </div>
                {selectedDeposit.admin_notes && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Admin Notes</Label>
                    <p className="font-medium">{selectedDeposit.admin_notes}</p>
                  </div>
                )}
                {selectedDeposit.rejection_reason && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Rejection Reason</Label>
                    <p className="font-medium text-destructive">{selectedDeposit.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Deposit</DialogTitle>
            <DialogDescription>
              Approve deposit of {selectedDeposit?.amount} {selectedDeposit?.currency} for {selectedDeposit?.user_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this approval..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>
              Approve Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Deposit</DialogTitle>
            <DialogDescription>
              Reject deposit of {selectedDeposit?.amount} {selectedDeposit?.currency} for {selectedDeposit?.user_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div>
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                placeholder="Add any additional notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DepositManagement;
