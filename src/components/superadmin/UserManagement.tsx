import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, RefreshCw, Edit, UserCheck, UserX, Wallet, TrendingUp, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  referral_code: string | null;
  parent_id: string | null;
  is_active: boolean;
  kyc_status: string;
  total_investment: number;
  total_roi_earned: number;
  total_referral_earned: number;
  created_at: string;
  updated_at: string;
  wallet_balance?: number;
  role?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedKycStatus, setSelectedKycStatus] = useState('');
  const [selectedActiveStatus, setSelectedActiveStatus] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletAction, setWalletAction] = useState<'add' | 'deduct'>('add');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch users from profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('user_id, balance')
        .eq('currency', 'USDT');

      if (walletsError) throw walletsError;

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data and add missing fields
      const usersWithWalletAndRole = usersData?.map(user => ({
        id: user.id,
        email: user.email || '',
        name: user.name,
        phone: user.phone,
        referral_code: user.referral_code,
        parent_id: user.referred_by,
        is_active: true,
        kyc_status: 'pending',
        total_investment: 0,
        total_roi_earned: 0,
        total_referral_earned: 0,
        created_at: user.created_at,
        updated_at: user.updated_at,
        wallet_balance: walletsData?.find(w => w.user_id === user.id)?.balance || 0,
        role: rolesData?.find(r => r.user_id === user.id)?.role || 'user'
      })) || [];

      setUsers(usersWithWalletAndRole);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscriptions
    const usersChannel = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchUsers();
      })
      .subscribe();

    const walletsChannel = supabase
      .channel('wallets-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallets', filter: 'currency=eq.USDT' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(walletsChannel);
    };
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Note: profiles table doesn't have is_active field
      // This is a simplified version
      toast({
        title: 'Info',
        description: 'User status management not fully implemented',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setSelectedKycStatus(user.kyc_status);
    setSelectedActiveStatus(user.is_active ? 'active' : 'inactive');
    setSelectedRole(user.role || 'user');
    setShowEditDialog(true);
  };

  const handleSaveUserChanges = async () => {
    if (!editingUser) return;

    try {
      // Update user role by deleting old and inserting new
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.id);

      if (deleteError) throw deleteError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: editingUser.id,
          role: selectedRole as 'admin' | 'superadmin' | 'user',
        }]);

      if (roleError) throw roleError;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
      setShowEditDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleWalletAction = async () => {
    if (!editingUser || !walletAmount) return;

    try {
      const amount = parseFloat(walletAmount);
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', editingUser.id)
        .eq('currency', 'USDT')
        .maybeSingle();

      const currentBalance = wallet?.balance || 0;
      const newBalance = walletAction === 'add' 
        ? currentBalance + amount 
        : Math.max(0, currentBalance - amount);

      const { error } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', editingUser.id)
        .eq('currency', 'USDT');

      if (error) throw error;

      // Create transaction record
      await supabase
        .from('transactions')
        .insert([{
          user_id: editingUser.id,
          type: 'admin_adjustment',
          amount: amount,
          balance_after: newBalance,
          currency: 'USDT',
          network: null,
          status: 'completed',
          notes: `Admin ${walletAction === 'add' ? 'credit' : 'debit'} by super admin`,
        }]);

      toast({
        title: 'Success',
        description: `Wallet ${walletAction === 'add' ? 'credited' : 'debited'} successfully`,
      });
      setShowWalletDialog(false);
      setWalletAmount('');
      fetchUsers();
    } catch (error) {
      console.error('Error updating wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to update wallet',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'secondary';
      default: return 'default';
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser) return;

    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in both password fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: editingUser.id,
          newPassword: newPassword,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Password has been reset successfully',
      });

      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      setEditingUser(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset password',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage all platform users and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by email, name, or referral code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={fetchUsers} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Referral</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {user.referral_code}
                      </code>
                    </TableCell>
                    <TableCell>{formatCurrency(user.wallet_balance || 0)}</TableCell>
                    <TableCell>{formatCurrency(user.total_investment || 0)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          ROI: {formatCurrency(user.total_roi_earned || 0)}
                        </div>
                        <div className="text-sm">
                          Ref: {formatCurrency(user.total_referral_earned || 0)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.kyc_status === 'verified' ? 'default' :
                        user.kyc_status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {user.kyc_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role || 'user')}>
                        {user.role || 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(user);
                            setShowWalletDialog(true);
                          }}
                        >
                          <Wallet className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(user);
                            setShowPasswordDialog(true);
                          }}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={user.is_active ? 'destructive' : 'default'}
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>KYC Status</Label>
              <Select value={selectedKycStatus} onValueChange={setSelectedKycStatus}>
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
            <div>
              <Label>Account Status</Label>
              <Select value={selectedActiveStatus} onValueChange={setSelectedActiveStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUserChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wallet Management Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Wallet</DialogTitle>
            <DialogDescription>
              Add or deduct funds from user's USDT wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select value={walletAction} onValueChange={(value: 'add' | 'deduct') => setWalletAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Funds</SelectItem>
                  <SelectItem value="deduct">Deduct Funds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (USDT)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWalletDialog(false);
              setWalletAmount('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleWalletAction}>
              {walletAction === 'add' ? 'Add Funds' : 'Deduct Funds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setNewPassword('');
              setConfirmPassword('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;