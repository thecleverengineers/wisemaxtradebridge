
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, DollarSign, ArrowLeft, Search, Filter, Download, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface InvestmentRecord {
  id: string;
  amount: number;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  daily_roi_amount: number;
  total_roi_expected: number;
  roi_credited_days: number;
  investment_plans: {
    name: string;
    daily_roi: number;
    duration_days: number;
  };
}

interface ROIRecord {
  id: string;
  amount: number;
  roi_date: string;
  credited_at: string;
  investment_id: string;
}

const InvestmentRecords = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [investments, setInvestments] = useState<InvestmentRecord[]>([]);
  const [roiRecords, setROIRecords] = useState<ROIRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      // Fetch investment records
      const { data: investmentData, error: investmentError } = await supabase
        .from('investments')
        .select(`
          *,
          investment_plans (name, daily_roi, duration_days)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (investmentError) throw investmentError;
      setInvestments(investmentData || []);

      // Fetch ROI records
      const { data: roiData, error: roiError } = await supabase
        .from('roi_ledger')
        .select('*')
        .eq('user_id', user?.id)
        .order('credited_at', { ascending: false });

      if (roiError) throw roiError;
      setROIRecords(roiData || []);

    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: "Error",
        description: "Failed to load investment records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredInvestments = investments.filter(investment => {
    const matchesSearch = investment.investment_plans?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || investment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateProgress = (investment: InvestmentRecord) => {
    const progress = (investment.roi_credited_days / investment.investment_plans?.duration_days) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-bounce" />
          <p>Loading investment records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
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
                <h1 className="text-2xl font-bold text-white">Investment Records</h1>
                <p className="text-purple-300">Track your investment performance</p>
              </div>
            </div>
            <Button
              onClick={() => {}}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
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
                <div className="flex space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                  <Button variant="outline" size="icon" className="border-white/10">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="investments" className="space-y-4">
            <TabsList className="bg-white/5 border-white/10">
              <TabsTrigger value="investments">Investment History</TabsTrigger>
              <TabsTrigger value="roi">ROI Records</TabsTrigger>
            </TabsList>

            <TabsContent value="investments" className="space-y-4">
              {filteredInvestments.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-300">No investment records found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredInvestments.map((investment) => (
                    <Card key={investment.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                              <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">{investment.investment_plans?.name}</h3>
                              <p className="text-purple-300 text-sm">
                                Started: {new Date(investment.start_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(investment.status)} text-white`}>
                            {investment.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-purple-300 text-sm">Investment</p>
                            <p className="text-white font-semibold">₹{investment.amount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-purple-300 text-sm">Daily ROI</p>
                            <p className="text-white font-semibold">₹{investment.daily_roi_amount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-purple-300 text-sm">Total Expected</p>
                            <p className="text-white font-semibold">₹{investment.total_roi_expected?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-purple-300 text-sm">Progress</p>
                            <p className="text-white font-semibold">{investment.roi_credited_days}/{investment.investment_plans?.duration_days} days</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calculateProgress(investment)}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2 text-sm text-purple-300">
                            <Calendar className="h-4 w-4" />
                            <span>Ends: {new Date(investment.end_date).toLocaleDateString()}</span>
                          </div>
                          <Button variant="outline" size="sm" className="border-white/10">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="roi" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">ROI Payment History</CardTitle>
                  <CardDescription className="text-purple-300">
                    Track your daily ROI payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {roiRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-300">No ROI records found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {roiRecords.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-semibold">₹{record.amount?.toLocaleString()}</p>
                            <p className="text-purple-300 text-sm">
                              ROI Date: {new Date(record.roi_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 text-sm">Credited</p>
                            <p className="text-purple-300 text-sm">
                              {new Date(record.credited_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default InvestmentRecords;
