
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings,
  Shield,
  BarChart3,
  UserCheck,
  UserX,
  Trophy,
  Target,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTrades: number;
  totalProfit: number;
  pendingWithdrawals: number;
  pendingKyc: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  kyc_status: string;
  wallet_real: number;
  wallet_demo: number;
  is_active: boolean;
  created_at: string;
  total_trades: number;
  total_deposits: number;
}

interface Asset {
  id: number;
  symbol: string;
  name: string;
  category: string;
  return_percent: number;
  status: string;
}

interface Tournament {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  status: string;
  participants: number;
}

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Asset form state
  const [assetForm, setAssetForm] = useState({
    symbol: '',
    name: '',
    category: 'forex',
    return_percent: 80,
    status: 'active'
  });

  // Tournament form state
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    prize_pool: 0,
    entry_fee: 0
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    
    loadAdminData();
  }, [user, isAdmin, navigate]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadAssets(),
        loadTournaments()
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadAssets = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const loadTournaments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/tournaments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        });
        loadUsers();
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const updateKycStatus = async (userId: number, status: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/users/${userId}/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ kyc_status: status })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `KYC status updated to ${status}`,
        });
        loadUsers();
      } else {
        throw new Error('Failed to update KYC status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update KYC status",
        variant: "destructive",
      });
    }
  };

  const addAsset = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assetForm)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Asset added successfully",
        });
        setAssetForm({
          symbol: '',
          name: '',
          category: 'forex',
          return_percent: 80,
          status: 'active'
        });
        loadAssets();
      } else {
        throw new Error('Failed to add asset');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add asset",
        variant: "destructive",
      });
    }
  };

  const updateAssetReturn = async (assetId: number, returnPercent: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/assets/${assetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ return_percent: returnPercent })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Asset return rate updated",
        });
        loadAssets();
      } else {
        throw new Error('Failed to update asset');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update asset",
        variant: "destructive",
      });
    }
  };

  const createTournament = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tournamentForm)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Tournament created successfully",
        });
        setTournamentForm({
          name: '',
          start_date: '',
          end_date: '',
          prize_pool: 0,
          entry_fee: 0
        });
        loadTournaments();
      } else {
        throw new Error('Failed to create tournament');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      });
    }
  };

  if (!user || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Shield className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-purple-300">Trading Platform Management</p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            Back to Platform
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Total Users</p>
                    <p className="text-white text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-green-400 text-sm">{stats.activeUsers} active</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Total Deposits</p>
                    <p className="text-white text-2xl font-bold">${stats.totalDeposits}</p>
                    <p className="text-yellow-400 text-sm">{stats.pendingWithdrawals} pending</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Total Trades</p>
                    <p className="text-white text-2xl font-bold">{stats.totalTrades}</p>
                    <p className="text-blue-400 text-sm">Platform Profit: ${stats.totalProfit}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Pending KYC</p>
                    <p className="text-white text-2xl font-bold">{stats.pendingKyc}</p>
                    <p className="text-orange-400 text-sm">Needs review</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Admin Interface */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-purple-300">
                  Manage user accounts, KYC status, and balances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-white font-semibold">{user.name}</h3>
                            <p className="text-purple-300 text-sm">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={`${
                                user.kyc_status === 'verified' ? 'bg-green-600' :
                                user.kyc_status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                              }`}>
                                KYC: {user.kyc_status}
                              </Badge>
                              <Badge className={user.is_active ? 'bg-green-600' : 'bg-red-600'}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-white font-semibold">Real: ${user.wallet_real}</p>
                            <p className="text-purple-300 text-sm">Demo: ${user.wallet_demo}</p>
                            <p className="text-blue-400 text-sm">{user.total_trades} trades</p>
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            {user.kyc_status === 'pending' && (
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  onClick={() => updateKycStatus(user.id, 'verified')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => updateKycStatus(user.id, 'rejected')}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              className={user.is_active ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}
                            >
                              {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets Management */}
          <TabsContent value="assets">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Add New Asset</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white text-sm">Symbol</label>
                      <Input
                        value={assetForm.symbol}
                        onChange={(e) => setAssetForm({...assetForm, symbol: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="BTCUSD"
                      />
                    </div>
                    <div>
                      <label className="text-white text-sm">Name</label>
                      <Input
                        value={assetForm.name}
                        onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Bitcoin/USD"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white text-sm">Category</label>
                      <Select value={assetForm.category} onValueChange={(value) => setAssetForm({...assetForm, category: value})}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="forex">Forex</SelectItem>
                          <SelectItem value="crypto">Crypto</SelectItem>
                          <SelectItem value="stocks">Stocks</SelectItem>
                          <SelectItem value="commodities">Commodities</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-white text-sm">Return %</label>
                      <Input
                        type="number"
                        value={assetForm.return_percent}
                        onChange={(e) => setAssetForm({...assetForm, return_percent: parseFloat(e.target.value)})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  
                  <Button onClick={addAsset} className="w-full bg-purple-600 hover:bg-purple-700">
                    Add Asset
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Existing Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {assets.map((asset) => (
                      <div key={asset.id} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-semibold">{asset.symbol}</h4>
                            <p className="text-purple-300 text-sm">{asset.name}</p>
                            <Badge className="mt-1">{asset.category}</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              defaultValue={asset.return_percent}
                              onBlur={(e) => updateAssetReturn(asset.id, parseFloat(e.target.value))}
                              className="w-20 bg-white/5 border-white/10 text-white text-center"
                            />
                            <span className="text-white">%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tournaments Management */}
          <TabsContent value="tournaments">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Create Tournament</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-white text-sm">Tournament Name</label>
                    <Input
                      value={tournamentForm.name}
                      onChange={(e) => setTournamentForm({...tournamentForm, name: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Weekly Championship"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white text-sm">Start Date</label>
                      <Input
                        type="datetime-local"
                        value={tournamentForm.start_date}
                        onChange={(e) => setTournamentForm({...tournamentForm, start_date: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white text-sm">End Date</label>
                      <Input
                        type="datetime-local"
                        value={tournamentForm.end_date}
                        onChange={(e) => setTournamentForm({...tournamentForm, end_date: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white text-sm">Prize Pool ($)</label>
                      <Input
                        type="number"
                        value={tournamentForm.prize_pool}
                        onChange={(e) => setTournamentForm({...tournamentForm, prize_pool: parseFloat(e.target.value)})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white text-sm">Entry Fee ($)</label>
                      <Input
                        type="number"
                        value={tournamentForm.entry_fee}
                        onChange={(e) => setTournamentForm({...tournamentForm, entry_fee: parseFloat(e.target.value)})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  
                  <Button onClick={createTournament} className="w-full bg-purple-600 hover:bg-purple-700">
                    <Trophy className="h-4 w-4 mr-2" />
                    Create Tournament
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Active Tournaments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tournaments.map((tournament) => (
                      <div key={tournament.id} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-semibold">{tournament.name}</h4>
                            <p className="text-purple-300 text-sm">
                              {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={tournament.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}>
                                {tournament.status}
                              </Badge>
                              <span className="text-blue-400 text-sm">{tournament.participants} participants</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">${tournament.prize_pool}</p>
                            <p className="text-purple-300 text-sm">Prize Pool</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Platform Settings</CardTitle>
                <CardDescription className="text-purple-300">
                  Configure platform-wide settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold">Trading Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-white text-sm">Minimum Trade Amount ($)</label>
                        <Input defaultValue="1" className="bg-white/5 border-white/10 text-white" />
                      </div>
                      <div>
                        <label className="text-white text-sm">Maximum Trade Amount ($)</label>
                        <Input defaultValue="1000" className="bg-white/5 border-white/10 text-white" />
                      </div>
                      <div>
                        <label className="text-white text-sm">Default Demo Balance ($)</label>
                        <Input defaultValue="10000" className="bg-white/5 border-white/10 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold">Referral Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-white text-sm">Level 1 Commission (%)</label>
                        <Input defaultValue="10" className="bg-white/5 border-white/10 text-white" />
                      </div>
                      <div>
                        <label className="text-white text-sm">Level 2 Commission (%)</label>
                        <Input defaultValue="5" className="bg-white/5 border-white/10 text-white" />
                      </div>
                      <div>
                        <label className="text-white text-sm">Level 3 Commission (%)</label>
                        <Input defaultValue="2" className="bg-white/5 border-white/10 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
