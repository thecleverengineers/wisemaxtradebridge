import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Plus, Edit, Trash2, Copy, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface DepositWallet {
  id: string;
  network: string;
  wallet_address: string;
  qr_code_url: string | null;
  is_active: boolean;
  minimum_deposit_amount: number;
  created_at: string;
}

export const DepositWalletsManagement = () => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<DepositWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<DepositWallet | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [network, setNetwork] = useState('TRC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [existingQrCodeUrl, setExistingQrCodeUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [minDepositAmount, setMinDepositAmount] = useState<string>('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('deposit_wallets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deposit wallets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (wallet?: DepositWallet) => {
    if (wallet) {
      setEditingWallet(wallet);
      setNetwork(wallet.network);
      setWalletAddress(wallet.wallet_address);
      setExistingQrCodeUrl(wallet.qr_code_url);
      setQrCodeFile(null);
      setIsActive(wallet.is_active);
      setMinDepositAmount(wallet.minimum_deposit_amount?.toString() || '0');
    } else {
      setEditingWallet(null);
      setNetwork('TRC20');
      setWalletAddress('');
      setExistingQrCodeUrl(null);
      setQrCodeFile(null);
      setIsActive(true);
      setMinDepositAmount('0');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!walletAddress.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Wallet address is required',
        variant: 'destructive',
      });
      return;
    }

    const minAmount = parseFloat(minDepositAmount);
    if (isNaN(minAmount) || minAmount < 0) {
      toast({
        title: 'Validation Error',
        description: 'Minimum deposit amount must be a valid positive number',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      let qrCodeUrl = existingQrCodeUrl;

      // Upload new QR code if file is selected
      if (qrCodeFile) {
        // Delete old QR code if exists
        if (existingQrCodeUrl) {
          const oldPath = existingQrCodeUrl.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('deposit-qr-codes')
              .remove([oldPath]);
          }
        }

        // Upload new QR code
        const fileExt = qrCodeFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('deposit-qr-codes')
          .upload(fileName, qrCodeFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('deposit-qr-codes')
          .getPublicUrl(fileName);

        qrCodeUrl = publicUrl;
      }

      if (editingWallet) {
        // Update existing wallet
        const { error } = await supabase
          .from('deposit_wallets')
          .update({
            network,
            wallet_address: walletAddress,
            qr_code_url: qrCodeUrl,
            is_active: isActive,
            minimum_deposit_amount: minAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingWallet.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Deposit wallet updated successfully' });
      } else {
        // Create new wallet
        const { error } = await supabase
          .from('deposit_wallets')
          .insert({
            network,
            wallet_address: walletAddress,
            qr_code_url: qrCodeUrl,
            is_active: isActive,
            minimum_deposit_amount: minAmount,
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Deposit wallet added successfully' });
      }

      setDialogOpen(false);
      fetchWallets();
    } catch (error: any) {
      console.error('Error saving wallet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save deposit wallet',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, qrCodeUrl: string | null) => {
    if (!confirm('Are you sure you want to delete this deposit wallet?')) return;

    try {
      // Delete QR code from storage if exists
      if (qrCodeUrl) {
        const fileName = qrCodeUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('deposit-qr-codes')
            .remove([fileName]);
        }
      }

      // Delete wallet record
      const { error } = await supabase
        .from('deposit_wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Deposit wallet deleted successfully' });
      fetchWallets();
    } catch (error: any) {
      console.error('Error deleting wallet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete deposit wallet',
        variant: 'destructive',
      });
    }
  };

  const copyAddress = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Copied', description: 'Wallet address copied to clipboard' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Deposit Wallet Management
              </CardTitle>
              <CardDescription>
                Manage deposit wallet addresses for different networks
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Wallet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingWallet ? 'Edit Deposit Wallet' : 'Add Deposit Wallet'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure deposit wallet address for user deposits
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="network">Network</Label>
                    <Select value={network} onValueChange={setNetwork}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                        <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                        <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
                        <SelectItem value="Polygon">Polygon</SelectItem>
                        <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="wallet-address">Wallet Address</Label>
                    <Input
                      id="wallet-address"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Enter wallet address"
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="qr-code">QR Code Image (Optional)</Label>
                    <Input
                      id="qr-code"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setQrCodeFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                    {existingQrCodeUrl && !qrCodeFile && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">Current QR Code:</p>
                        <img 
                          src={existingQrCodeUrl} 
                          alt="Current QR Code" 
                          className="w-24 h-24 border rounded"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="min-deposit">Minimum Deposit Amount (USDT)</Label>
                    <Input
                      id="min-deposit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={minDepositAmount}
                      onChange={(e) => setMinDepositAmount(e.target.value)}
                      placeholder="Enter minimum deposit amount"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-active">Active</Label>
                    <Switch
                      id="is-active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? 'Saving...' : editingWallet ? 'Update Wallet' : 'Add Wallet'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deposit wallets configured. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Min. Deposit</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <Badge variant="outline">{wallet.network}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {wallet.wallet_address.substring(0, 10)}...
                          {wallet.wallet_address.substring(wallet.wallet_address.length - 10)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyAddress(wallet.wallet_address, wallet.id)}
                        >
                          {copied === wallet.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${wallet.minimum_deposit_amount}</span>
                    </TableCell>
                    <TableCell>
                      {wallet.qr_code_url ? (
                        <Badge variant="secondary">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {wallet.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(wallet)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(wallet.id, wallet.qr_code_url)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
