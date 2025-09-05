import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Ban, CheckCircle, XCircle } from 'lucide-react';
import { supabaseUntyped as supabase } from '@/integrations/supabase/untyped';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  kyc_status: 'pending' | 'approved' | 'rejected' | string;
  is_active: boolean;
  total_investment?: number;
  total_roi_earned?: number;
  total_referral_earned?: number;
  created_at?: string;
  referral_code?: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get auth users for email - using a more defensive approach
      let enrichedUsers = usersData || [];
      
      try {
        const { data: authData } = await supabase.auth.admin.listUsers();
        
        if (authData?.users) {
          enrichedUsers = (usersData || []).map(user => {
            const authUser = authData.users.find((au: any) => au.id === user.id);
            return {
              ...user,
              email: authUser?.email || 'No email'
            };
          });
        }
      } catch (authError) {
        console.warn('Could not fetch auth data:', authError);
        // Continue with users data without email enrichment
      }

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateKYCStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ kyc_status: status })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success", 
        description: `KYC status updated to ${status}`,
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating KYC:', error);
      toast({
        title: "Error",
        description: "Failed to update KYC status",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!isActive ? 'activated' : 'deactivated'}`,
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error", 
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getKYCBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">KYC Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter(u => u.kyc_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${users.reduce((sum, u) => sum + (u.total_investment || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Manage and monitor all platform users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users..."
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
                  <TableHead>Contact</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>ROI Earned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.referral_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{user.email}</div>
                        <div className="text-sm text-slate-500">{user.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getKYCBadge(user.kyc_status)}</TableCell>
                    <TableCell>${(user.total_investment || 0).toLocaleString()}</TableCell>
                    <TableCell>${(user.total_roi_earned || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>User Details</DialogTitle>
                              <DialogDescription>
                                Manage user information and settings
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <Tabs defaultValue="profile">
                                <TabsList>
                                  <TabsTrigger value="profile">Profile</TabsTrigger>
                                  <TabsTrigger value="financial">Financial</TabsTrigger>
                                  <TabsTrigger value="actions">Actions</TabsTrigger>
                                </TabsList>
                                <TabsContent value="profile" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Name</label>
                                      <p className="text-sm text-slate-600">{selectedUser.name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Email</label>
                                      <p className="text-sm text-slate-600">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Phone</label>
                                      <p className="text-sm text-slate-600">{selectedUser.phone || 'Not provided'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Referral Code</label>
                                      <p className="text-sm text-slate-600">{selectedUser.referral_code}</p>
                                    </div>
                                  </div>
                                </TabsContent>
                                <TabsContent value="financial" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Total Investment</label>
                                      <p className="text-sm text-slate-600">${(selectedUser.total_investment || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">ROI Earned</label>
                                      <p className="text-sm text-slate-600">${(selectedUser.total_roi_earned || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Referral Earned</label>
                                      <p className="text-sm text-slate-600">${(selectedUser.total_referral_earned || 0).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </TabsContent>
                                <TabsContent value="actions" className="space-y-4">
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">KYC Status</label>
                                      <div className="flex space-x-2 mt-2">
                                        <Button
                                          size="sm"
                                          onClick={() => updateKYCStatus(selectedUser.id, 'approved')}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="mr-1 h-3 w-3" />
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => updateKYCStatus(selectedUser.id, 'rejected')}
                                          variant="destructive"
                                        >
                                          <XCircle className="mr-1 h-3 w-3" />
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">User Status</label>
                                      <div className="mt-2">
                                        <Button
                                          size="sm"
                                          onClick={() => toggleUserStatus(selectedUser.id, selectedUser.is_active)}
                                          variant={selectedUser.is_active ? "destructive" : "default"}
                                        >
                                          {selectedUser.is_active ? (
                                            <>
                                              <Ban className="mr-1 h-3 w-3" />
                                              Deactivate
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle className="mr-1 h-3 w-3" />
                                              Activate
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
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
