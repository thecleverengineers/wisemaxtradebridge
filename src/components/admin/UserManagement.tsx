import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Edit, Ban, CheckCircle, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  referral_code: string;
  is_active: boolean;
  kyc_status: string;
  total_investment: number;
  total_roi_earned: number;
  total_referral_earned: number;
  created_at: string;
  wallet_balance?: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch users with their wallet balances
  const fetchUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch wallet balances for each user
      const usersWithBalances = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .eq('currency', 'USDT')
            .single();

          return {
            ...user,
            wallet_balance: walletData?.balance || 0
          };
        })
      );

      setUsers(usersWithBalances);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchUsers();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('User change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Add new user with wallet balance
            const fetchNewUser = async () => {
              const { data: walletData } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', payload.new.id)
                .eq('currency', 'USDT')
                .single();

              setUsers(prev => [{
                ...payload.new as User,
                wallet_balance: walletData?.balance || 0
              }, ...prev]);
            };
            fetchNewUser();
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev => prev.map(user => 
              user.id === payload.new.id ? { ...user, ...payload.new as User } : user
            ));
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(user => user.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to wallet changes for balance updates
    const walletChannel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets'
        },
        (payload) => {
          if (payload.new.currency === 'USDT') {
            setUsers(prev => prev.map(user =>
              user.id === payload.new.user_id
                ? { ...user, wallet_balance: payload.new.balance }
                : user
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(walletChannel);
    };
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.referral_code?.toLowerCase().includes(query)
    );
  });

  // Handle user actions
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setKycStatus(user.kyc_status);
    setIsActive(user.is_active);
    setEditDialogOpen(true);
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          kyc_status: kycStatus,
          is_active: isActive
        })
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      toast.success('User updated successfully');
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all platform users • {users.length} total users
              </CardDescription>
            </div>
            <Button onClick={fetchUsers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="Search users by email, name, or referral code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Wallet Balance</TableHead>
                    <TableHead>Total Investment</TableHead>
                    <TableHead>ROI Earned</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {user.referral_code}
                          </code>
                        </TableCell>
                        <TableCell>{formatCurrency(user.wallet_balance || 0)}</TableCell>
                        <TableCell>{formatCurrency(user.total_investment)}</TableCell>
                        <TableCell>{formatCurrency(user.total_roi_earned)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.kyc_status === 'verified' ? 'default' :
                            user.kyc_status === 'pending' ? 'secondary' : 'outline'
                          }>
                            {user.kyc_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'destructive'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                            >
                              {user.is_active ? (
                                <UserX className="h-4 w-4 text-destructive" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and status
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={selectedUser.email} disabled />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={selectedUser.name || 'N/A'} disabled />
              </div>
              <div>
                <Label>KYC Status</Label>
                <Select value={kycStatus} onValueChange={setKycStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Account Status</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{isActive ? 'Active' : 'Inactive'}</span>
                  <Button
                    size="sm"
                    variant={isActive ? 'default' : 'destructive'}
                    onClick={() => setIsActive(!isActive)}
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUserChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;