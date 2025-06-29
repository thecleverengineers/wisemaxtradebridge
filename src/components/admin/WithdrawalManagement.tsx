
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  net_amount: number;
  fee_amount: number;
  withdrawal_method: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requested_at: string;
  approved_at?: string;
  processed_at?: string;
  admin_notes?: string;
  upi_id?: string;
  bank_details?: any;
  user_name?: string;
}

export const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data: withdrawalData, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Get user names separately
      const userIds = [...new Set(withdrawalData?.map(w => w.user_id) || [])];
      const { data: userData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds);

      const enrichedWithdrawals = (withdrawalData || []).map(withdrawal => {
        const user = userData?.find(u => u.id === withdrawal.user_id);
        return {
          ...withdrawal,
          user_name: user?.name || 'Unknown User'
        };
      });

      setWithdrawals(enrichedWithdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch withdrawals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateWithdrawalStatus = async (
    withdrawalId: string, 
    status: 'approved' | 'rejected' | 'processed',
    notes?: string
  ) => {
    try {
      const updates: any = { 
        status,
        admin_notes: notes 
      };

      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
      } else if (status === 'processed') {
        updates.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('withdrawals')
        .update(updates)
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Withdrawal ${status} successfully`,
      });
      
      fetchWithdrawals();
      setSelectedWithdrawal(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to update withdrawal status",
        variant: "destructive",
      });
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal =>
    withdrawal.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    withdrawal.withdrawal_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700">Approved</Badge>;
      case 'processed':
        return <Badge className="bg-green-100 text-green-700">Processed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Withdrawal Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withdrawals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {withdrawals.filter(w => w.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${withdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${withdrawals.filter(w => w.status === 'processed').reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>Review and process user withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search withdrawals..."
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
                  <TableHead>User</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <div className="font-medium">{withdrawal.user_name}</div>
                    </TableCell>
                    <TableCell className="capitalize">{withdrawal.withdrawal_method}</TableCell>
                    <TableCell>${withdrawal.amount.toLocaleString()}</TableCell>
                    <TableCell>${(withdrawal.fee_amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">${withdrawal.net_amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell>
                      {new Date(withdrawal.requested_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedWithdrawal(withdrawal)}
                          >
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Withdrawal Request Details</DialogTitle>
                            <DialogDescription>
                              Review and process withdrawal request
                            </DialogDescription>
                          </DialogHeader>
                          {selectedWithdrawal && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">User</label>
                                  <p className="text-sm text-slate-600">{selectedWithdrawal.user_name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Method</label>
                                  <p className="text-sm text-slate-600 capitalize">{selectedWithdrawal.withdrawal_method}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Amount</label>
                                  <p className="text-sm text-slate-600">${selectedWithdrawal.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Fee</label>
                                  <p className="text-sm text-slate-600">${(selectedWithdrawal.fee_amount || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Net Amount</label>
                                  <p className="text-sm text-slate-600 font-medium">${selectedWithdrawal.net_amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <div className="mt-1">{getStatusBadge(selectedWithdrawal.status)}</div>
                                </div>
                              </div>

                              {selectedWithdrawal.withdrawal_method === 'upi' && selectedWithdrawal.upi_id && (
                                <div>
                                  <label className="text-sm font-medium">UPI ID</label>
                                  <p className="text-sm text-slate-600">{selectedWithdrawal.upi_id}</p>
                                </div>
                              )}

                              {selectedWithdrawal.bank_details && (
                                <div>
                                  <label className="text-sm font-medium">Bank Details</label>
                                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                                    <pre>{JSON.stringify(selectedWithdrawal.bank_details, null, 2)}</pre>
                                  </div>
                                </div>
                              )}

                              {selectedWithdrawal.admin_notes && (
                                <div>
                                  <label className="text-sm font-medium">Previous Notes</label>
                                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                                    {selectedWithdrawal.admin_notes}
                                  </p>
                                </div>
                              )}

                              <div>
                                <label className="text-sm font-medium">Admin Notes</label>
                                <Textarea
                                  placeholder="Add notes about this withdrawal request..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  className="mt-1"
                                />
                              </div>

                              {selectedWithdrawal.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => updateWithdrawalStatus(selectedWithdrawal.id, 'approved', adminNotes)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => updateWithdrawalStatus(selectedWithdrawal.id, 'rejected', adminNotes)}
                                    variant="destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {selectedWithdrawal.status === 'approved' && (
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => updateWithdrawalStatus(selectedWithdrawal.id, 'processed', adminNotes)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Mark as Processed
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
