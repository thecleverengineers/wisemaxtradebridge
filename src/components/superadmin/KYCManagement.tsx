import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface KYCRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  kyc_status: string;
  kyc_pan_number: string;
  kyc_aadhar_number: string;
  kyc_usdt_wallet: string;
  kyc_submitted_at: string;
  kyc_approved_at: string | null;
}

const KYCManagement = () => {
  const { toast } = useToast();
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchKYCRecords();
  }, []);

  const fetchKYCRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone, kyc_status, kyc_pan_number, kyc_aadhar_number, kyc_usdt_wallet, kyc_submitted_at, kyc_approved_at')
        .not('kyc_submitted_at', 'is', null)
        .order('kyc_submitted_at', { ascending: false });

      if (error) throw error;
      setKycRecords(data || []);
    } catch (error) {
      console.error('Error fetching KYC records:', error);
      toast({
        title: "Error",
        description: "Failed to load KYC records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveKYC = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'approved',
          kyc_approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "KYC Approved",
        description: "User KYC has been approved successfully",
      });

      fetchKYCRecords();
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast({
        title: "Error",
        description: "Failed to approve KYC",
        variant: "destructive",
      });
    }
  };

  const handleRejectKYC = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'rejected',
          kyc_approved_at: null
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "KYC Rejected",
        description: "User KYC has been rejected",
      });

      fetchKYCRecords();
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast({
        title: "Error",
        description: "Failed to reject KYC",
        variant: "destructive",
      });
    }
  };

  const filteredRecords = kycRecords.filter(record => {
    const matchesSearch = 
      record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.kyc_pan_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || record.kyc_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>;
    }
  };

  const stats = {
    total: kycRecords.length,
    pending: kycRecords.filter(r => r.kyc_status === 'pending').length,
    approved: kycRecords.filter(r => r.kyc_status === 'approved').length,
    rejected: kycRecords.filter(r => r.kyc_status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            KYC Management
          </h2>
          <p className="text-muted-foreground mt-2">
            Review and approve user KYC submissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Submissions</CardTitle>
          <CardDescription>Review and manage user KYC verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or PAN number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('approved')}
              >
                Approved
              </Button>
              <Button
                variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('rejected')}
              >
                Rejected
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>PAN Number</TableHead>
                  <TableHead>Aadhar Number</TableHead>
                  <TableHead>USDT Wallet</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No KYC submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{record.email}</div>
                          {record.phone && (
                            <div className="text-sm text-muted-foreground">{record.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.kyc_pan_number}</TableCell>
                      <TableCell className="font-mono text-sm">{record.kyc_aadhar_number}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate" title={record.kyc_usdt_wallet}>
                        {record.kyc_usdt_wallet}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.kyc_submitted_at ? format(new Date(record.kyc_submitted_at), 'PPp') : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.kyc_status)}</TableCell>
                      <TableCell>
                        {record.kyc_status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveKYC(record.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectKYC(record.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {record.kyc_status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectKYC(record.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        )}
                        {record.kyc_status === 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveKYC(record.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
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

export default KYCManagement;
