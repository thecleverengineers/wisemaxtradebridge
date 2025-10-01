
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Eye,
  PiggyBank,
  ChartBar,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Wallet,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  Timer,
  FileText,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface InvestmentRecord {
  id: string;
  amount: number;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_roi_earned: number;
  last_payout_date: string | null;
  investment_plans?: {
    name: string;
    daily_roi: number;
    duration_days: number;
    total_return_percent: number;
  };
}

interface ROIRecord {
  id: string;
  amount: number;
  created_at: string;
  investment_id: string;
  earning_type: string;
}

interface OverallStats {
  totalInvested: number;
  totalReturns: number;
  activeInvestments: number;
  completedInvestments: number;
  averageROI: number;
  bestPerformingPlan: string;
  totalProfit: number;
  pendingReturns: number;
  todayEarnings: number;
  monthlyEarnings: number;
  withdrawableAmount: number;
  lockedAmount: number;
}

const InvestmentRecords = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [investments, setInvestments] = useState<InvestmentRecord[]>([]);
  const [roiRecords, setROIRecords] = useState<ROIRecord[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalInvested: 0,
    totalReturns: 0,
    activeInvestments: 0,
    completedInvestments: 0,
    averageROI: 0,
    bestPerformingPlan: 'N/A',
    totalProfit: 0,
    pendingReturns: 0,
    todayEarnings: 0,
    monthlyEarnings: 0,
    withdrawableAmount: 0,
    lockedAmount: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscriptions
    const investmentChannel = supabase
      .channel('investment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchRecords();
        }
      )
      .subscribe();

    const roiChannel = supabase
      .channel('roi-earnings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roi_earnings',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(investmentChannel);
      supabase.removeChannel(roiChannel);
    };
  }, [user]);

  const fetchRecords = async () => {
    try {
      // Fetch investment records
      const { data: investmentData, error: investmentError } = await supabase
        .from('investments')
        .select(`
          *,
          investment_plans (name, daily_roi, duration_days, total_return_percent)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (investmentError) throw investmentError;
      setInvestments(investmentData || []);

      // Fetch ROI earnings
      const { data: roiData, error: roiError } = await supabase
        .from('roi_earnings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (roiError) throw roiError;
      setROIRecords(roiData || []);

      // Calculate overall statistics
      calculateStats(investmentData || [], roiData || []);
      prepareChartData(investmentData || [], roiData || []);

    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: "Error",
        description: "Failed to load investment records",
        variant: "destructive",
      });
    }
  };

  const calculateStats = (investments: InvestmentRecord[], roiRecords: ROIRecord[]) => {
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalReturns = roiRecords.reduce((sum, roi) => sum + (roi.amount || 0), 0);
    const activeInvestments = investments.filter(inv => inv.status === 'active').length;
    const completedInvestments = investments.filter(inv => inv.status === 'completed').length;
    
    // Calculate today's earnings
    const today = new Date().toDateString();
    const todayEarnings = roiRecords
      .filter(roi => new Date(roi.created_at).toDateString() === today)
      .reduce((sum, roi) => sum + roi.amount, 0);
    
    // Calculate this month's earnings
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyEarnings = roiRecords
      .filter(roi => {
        const roiDate = new Date(roi.created_at);
        return roiDate.getMonth() === currentMonth && roiDate.getFullYear() === currentYear;
      })
      .reduce((sum, roi) => sum + roi.amount, 0);
    
    // Calculate pending returns
    const pendingReturns = investments
      .filter(inv => inv.status === 'active')
      .reduce((sum, inv) => {
        const expectedReturn = inv.amount * ((inv.investment_plans?.total_return_percent || 0) / 100);
        const earnedSoFar = inv.total_roi_earned || 0;
        return sum + (expectedReturn - earnedSoFar);
      }, 0);
    
    // Find best performing plan
    const planPerformance = investments.reduce((acc: any, inv) => {
      const planName = inv.investment_plans?.name || 'Unknown';
      if (!acc[planName]) {
        acc[planName] = { total: 0, count: 0 };
      }
      acc[planName].total += inv.total_roi_earned || 0;
      acc[planName].count += 1;
      return acc;
    }, {});
    
    const bestPlan = Object.entries(planPerformance)
      .sort((a: any, b: any) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0];
    
    const averageROI = totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0;
    
    // Calculate locked amount (active investments)
    const lockedAmount = investments
      .filter(inv => inv.status === 'active')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    setOverallStats({
      totalInvested,
      totalReturns,
      activeInvestments,
      completedInvestments,
      averageROI,
      bestPerformingPlan: bestPlan ? bestPlan[0] : 'N/A',
      totalProfit: totalReturns - totalInvested,
      pendingReturns,
      todayEarnings,
      monthlyEarnings,
      withdrawableAmount: totalReturns,
      lockedAmount
    });
  };

  const prepareChartData = (investments: InvestmentRecord[], roiRecords: ROIRecord[]) => {
    // Prepare daily earnings chart data (last 30 days)
    const dailyData: any = {};
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    roiRecords
      .filter(roi => new Date(roi.created_at) >= last30Days)
      .forEach(roi => {
        const date = new Date(roi.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyData[date] = (dailyData[date] || 0) + roi.amount;
      });
    
    const chartArray = Object.entries(dailyData).map(([date, amount]) => ({
      date,
      amount
    })).slice(-14); // Show last 14 days
    
    setChartData(chartArray);
    
    // Prepare pie chart data
    const statusData = investments.reduce((acc: any, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + inv.amount;
      return acc;
    }, {});
    
    const pieArray = Object.entries(statusData).map(([status, amount]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: amount
    }));
    
    setPieData(pieArray);
    
    // Prepare monthly comparison data
    const monthlyComparison: any = {};
    roiRecords.forEach(roi => {
      const month = new Date(roi.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyComparison[month] = (monthlyComparison[month] || 0) + roi.amount;
    });
    
    const monthlyArray = Object.entries(monthlyComparison)
      .slice(-6)
      .map(([month, earnings]) => ({
        month,
        earnings
      }));
    
    setMonthlyData(monthlyArray);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'matured': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredInvestments = investments.filter(investment => {
    const matchesSearch = investment.investment_plans?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || investment.status === statusFilter;
    
    let matchesTime = true;
    if (timeFilter !== 'all') {
      const createdDate = new Date(investment.created_at);
      const now = new Date();
      if (timeFilter === '7days') {
        matchesTime = (now.getTime() - createdDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      } else if (timeFilter === '30days') {
        matchesTime = (now.getTime() - createdDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      } else if (timeFilter === '90days') {
        matchesTime = (now.getTime() - createdDate.getTime()) <= 90 * 24 * 60 * 60 * 1000;
      }
    }
    
    return matchesSearch && matchesStatus && matchesTime;
  });

  const calculateProgress = (investment: InvestmentRecord) => {
    const startDate = new Date(investment.start_date);
    const endDate = new Date(investment.end_date);
    const now = new Date();
    
    if (now >= endDate) return 100;
    if (now <= startDate) return 0;
    
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.min((elapsed / total) * 100, 100);
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-900">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Investment Records</h1>
                <p className="text-purple-300">Complete overview of your investment portfolio</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchRecords()}
                variant="outline"
                className="border-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => {}}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Overall Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm">Total Invested</p>
                    <p className="text-2xl font-bold text-white">
                      ${overallStats.totalInvested.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-300 mt-1">
                      Across {investments.length} investments
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <PiggyBank className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm">Total Returns</p>
                    <p className="text-2xl font-bold text-white">
                      ${overallStats.totalReturns.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-300 mt-1 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {overallStats.averageROI.toFixed(2)}% ROI
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Active Plans</p>
                    <p className="text-2xl font-bold text-white">
                      {overallStats.activeInvestments}
                    </p>
                    <p className="text-xs text-purple-300 mt-1">
                      ${overallStats.lockedAmount.toLocaleString()} locked
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Activity className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-300 text-sm">Today's Earnings</p>
                    <p className="text-2xl font-bold text-white">
                      ${overallStats.todayEarnings.toLocaleString()}
                    </p>
                    <p className="text-xs text-yellow-300 mt-1">
                      Monthly: ${overallStats.monthlyEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-500/20 rounded-xl">
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Daily Earnings Chart */}
            <Card className="lg:col-span-2 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ChartBar className="h-5 w-5 text-purple-400" />
                  Daily Earnings Trend
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Last 14 days performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Investment Distribution Pie Chart */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Portfolio Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                    <Input
                      placeholder="Search investments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="matured">Matured</option>
                    <option value="paused">Paused</option>
                  </select>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                  >
                    <option value="all">All Time</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                  </select>
                  <Button variant="outline" size="icon" className="border-white/10">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="bg-white/5 border-white/10">
              <TabsTrigger value="active">Active Investments</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="roi">ROI History</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Active Investments Tab */}
            <TabsContent value="active" className="space-y-4">
              <ScrollArea className="h-[600px]">
                {filteredInvestments.filter(inv => inv.status === 'active').length === 0 ? (
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-8 text-center">
                      <Activity className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-300">No active investments</p>
                      <Button
                        onClick={() => navigate('/roi-investments')}
                        className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600"
                      >
                        Start Investing
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {filteredInvestments.filter(inv => inv.status === 'active').map((investment) => (
                      <Card key={investment.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-xl">
                                <Target className="h-6 w-6 text-purple-400" />
                              </div>
                              <div>
                                <h3 className="text-white font-semibold text-lg">
                                  {investment.investment_plans?.name || 'Investment Plan'}
                                </h3>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-purple-300 text-sm flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Started {formatDistanceToNow(new Date(investment.start_date), { addSuffix: true })}
                                  </span>
                                  <Badge className={`${getStatusColor(investment.status)} text-white`}>
                                    {investment.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="border-white/10">
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <div>
                              <p className="text-purple-300 text-xs">Invested</p>
                              <p className="text-white font-semibold">${investment.amount?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-purple-300 text-xs">Daily ROI</p>
                              <p className="text-white font-semibold">
                                {investment.investment_plans?.daily_roi}%
                              </p>
                            </div>
                            <div>
                              <p className="text-purple-300 text-xs">Earned So Far</p>
                              <p className="text-green-400 font-semibold">
                                ${(investment.total_roi_earned || 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-purple-300 text-xs">Expected Return</p>
                              <p className="text-white font-semibold">
                                ${(investment.amount * ((investment.investment_plans?.total_return_percent || 0) / 100)).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-purple-300 text-xs">Duration</p>
                              <p className="text-white font-semibold">
                                {investment.investment_plans?.duration_days} days
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-purple-300">Progress</span>
                              <span className="text-purple-300">{calculateProgress(investment).toFixed(1)}%</span>
                            </div>
                            <Progress value={calculateProgress(investment)} className="h-2" />
                            <div className="flex justify-between text-xs text-purple-300">
                              <span>{new Date(investment.start_date).toLocaleDateString()}</span>
                              <span>{new Date(investment.end_date).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {investment.last_payout_date && (
                            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                              <p className="text-green-400 text-sm flex items-center">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Last payout: {formatDistanceToNow(new Date(investment.last_payout_date), { addSuffix: true })}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Completed Investments Tab */}
            <TabsContent value="completed" className="space-y-4">
              <ScrollArea className="h-[600px]">
                {filteredInvestments.filter(inv => ['completed', 'matured'].includes(inv.status)).length === 0 ? (
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-8 text-center">
                      <Award className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-300">No completed investments yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {filteredInvestments.filter(inv => ['completed', 'matured'].includes(inv.status)).map((investment) => (
                      <Card key={investment.id} className="bg-white/5 border-white/10">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-gradient-to-br from-blue-500/30 to-green-500/30 rounded-xl">
                                <CheckCircle2 className="h-6 w-6 text-green-400" />
                              </div>
                              <div>
                                <h3 className="text-white font-semibold">
                                  {investment.investment_plans?.name}
                                </h3>
                                <p className="text-purple-300 text-sm">
                                  Completed {formatDistanceToNow(new Date(investment.end_date), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-semibold text-lg">
                                +${(investment.total_roi_earned || 0).toLocaleString()}
                              </p>
                              <p className="text-purple-300 text-sm">
                                {((investment.total_roi_earned || 0) / investment.amount * 100).toFixed(2)}% ROI
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ROI History Tab */}
            <TabsContent value="roi" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">ROI Payment History</CardTitle>
                  <CardDescription className="text-purple-300">
                    All your ROI payments and earnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {roiRecords.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <p className="text-purple-300">No ROI records found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {roiRecords.map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-500/20 rounded-lg">
                                <ArrowDownRight className="h-4 w-4 text-green-400" />
                              </div>
                              <div>
                                <p className="text-white font-semibold">
                                  ${record.amount?.toLocaleString()}
                                </p>
                                <p className="text-purple-300 text-sm">
                                  {record.earning_type === 'compound' ? 'Compound Interest' : 'ROI Payment'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                Credited
                              </Badge>
                              <p className="text-purple-300 text-xs mt-1">
                                {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4">
                {/* Monthly Performance */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-400" />
                      Monthly Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                          labelStyle={{ color: '#cbd5e1' }}
                        />
                        <Bar dataKey="earnings" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Investment Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Award className="h-8 w-8 text-yellow-400" />
                        <Badge className="bg-yellow-500/20 text-yellow-400">Best</Badge>
                      </div>
                      <p className="text-purple-300 text-sm">Best Performing Plan</p>
                      <p className="text-white font-semibold text-lg">
                        {overallStats.bestPerformingPlan}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Timer className="h-8 w-8 text-blue-400" />
                        <Badge className="bg-blue-500/20 text-blue-400">Pending</Badge>
                      </div>
                      <p className="text-purple-300 text-sm">Pending Returns</p>
                      <p className="text-white font-semibold text-lg">
                        ${overallStats.pendingReturns.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Wallet className="h-8 w-8 text-green-400" />
                        <Badge className="bg-green-500/20 text-green-400">Available</Badge>
                      </div>
                      <p className="text-purple-300 text-sm">Total Profit</p>
                      <p className="text-white font-semibold text-lg">
                        ${overallStats.totalProfit.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default InvestmentRecords;
