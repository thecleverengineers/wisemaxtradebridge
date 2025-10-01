import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Plus, Save, Wallet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const WalletManagement = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [walletAddresses, setWalletAddresses] = useState([
    {
      id: 1,
      currency: 'USDT',
      network: 'BEP20',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
      label: 'Main Deposit Wallet',
      isActive: true
    },
    {
      id: 2,
      currency: 'USDT',
      network: 'TRC20',
      address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
      label: 'Secondary Wallet',
      isActive: false
    },
    {
      id: 3,
      currency: 'BTC',
      network: 'Bitcoin',
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      label: 'BTC Wallet',
      isActive: true
    }
  ]);

  const [newWallet, setNewWallet] = useState({
    currency: '',
    network: '',
    address: '',
    label: ''
  });

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleSaveWallet = () => {
    if (!newWallet.currency || !newWallet.network || !newWallet.address) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const wallet = {
      id: Date.now(),
      ...newWallet,
      isActive: true
    };

    setWalletAddresses([...walletAddresses, wallet]);
    setNewWallet({ currency: '', network: '', address: '', label: '' });
    
    toast({
      title: "Success",
      description: "Wallet address added successfully",
    });
  };

  const toggleWalletStatus = (id: number) => {
    setWalletAddresses(walletAddresses.map(wallet => 
      wallet.id === id ? { ...wallet, isActive: !wallet.isActive } : wallet
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Deposit Wallet Addresses</CardTitle>
              <CardDescription>Manage cryptocurrency wallet addresses for user deposits</CardDescription>
            </div>
            <Button 
              variant={isEditing ? "secondary" : "default"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Add Wallet'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing && (
            <div className="mb-6 p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Currency</Label>
                  <Select 
                    value={newWallet.currency}
                    onValueChange={(value) => setNewWallet({...newWallet, currency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="BTC">Bitcoin</SelectItem>
                      <SelectItem value="ETH">Ethereum</SelectItem>
                      <SelectItem value="BNB">BNB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Network</Label>
                  <Select 
                    value={newWallet.network}
                    onValueChange={(value) => setNewWallet({...newWallet, network: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
                      <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                      <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                      <SelectItem value="Bitcoin">Bitcoin Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Wallet Address</Label>
                <Input 
                  placeholder="Enter wallet address"
                  value={newWallet.address}
                  onChange={(e) => setNewWallet({...newWallet, address: e.target.value})}
                />
              </div>
              <div>
                <Label>Label (Optional)</Label>
                <Input 
                  placeholder="e.g., Main Deposit Wallet"
                  value={newWallet.label}
                  onChange={(e) => setNewWallet({...newWallet, label: e.target.value})}
                />
              </div>
              <Button onClick={handleSaveWallet} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Wallet Address
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walletAddresses.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.currency}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{wallet.network}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyAddress(wallet.address)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{wallet.label}</TableCell>
                  <TableCell>
                    <Badge variant={wallet.isActive ? "default" : "secondary"}>
                      {wallet.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleWalletStatus(wallet.id)}
                      >
                        {wallet.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Settings</CardTitle>
          <CardDescription>Configure wallet display settings for users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Show QR Code for Deposits</Label>
            <input type="checkbox" defaultChecked className="toggle" />
          </div>
          <div className="flex items-center justify-between">
            <Label>Require Network Confirmation</Label>
            <input type="checkbox" defaultChecked className="toggle" />
          </div>
          <div className="flex items-center justify-between">
            <Label>Auto-detect Transaction</Label>
            <input type="checkbox" className="toggle" />
          </div>
          <div>
            <Label>Minimum Deposit Amount (USDT)</Label>
            <Input type="number" defaultValue="10" className="mt-2" />
          </div>
          <div>
            <Label>Network Fee Notice</Label>
            <Input 
              defaultValue="Please ensure to add network fees when making deposits" 
              className="mt-2"
            />
          </div>
          <Button className="w-full">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletManagement;