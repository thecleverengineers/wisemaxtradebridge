
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash,
  Save,
  Eye,
  EyeOff,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DynamicFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
  config: Record<string, any>;
  permissions: string[];
  lastModified: Date;
  createdBy: string;
}

interface FeatureCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  features: DynamicFeature[];
}

export const DynamicFeatureManager = () => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<DynamicFeature[]>([]);
  const [categories, setCategories] = useState<FeatureCategory[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<DynamicFeature | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newFeature, setNewFeature] = useState({
    name: '',
    description: '',
    category: '',
    config: '{}',
    permissions: ''
  });

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = () => {
    // Mock data - in real implementation, this would come from Supabase
    const mockFeatures: DynamicFeature[] = [
      {
        id: '1',
        name: 'Advanced Trading Analytics',
        description: 'Real-time market analysis with AI predictions',
        category: 'trading',
        isEnabled: true,
        config: {
          updateInterval: 5000,
          analyticsDepth: 'advanced',
          aiPredictions: true
        },
        permissions: ['admin', 'premium_user'],
        lastModified: new Date(),
        createdBy: 'system'
      },
      {
        id: '2',
        name: 'Social Trading Network',
        description: 'Copy trading and social features',
        category: 'social',
        isEnabled: true,
        config: {
          maxFollowers: 1000,
          copyTradingEnabled: true,
          leaderboardVisible: true
        },
        permissions: ['admin', 'user'],
        lastModified: new Date(),
        createdBy: 'admin'
      },
      {
        id: '3',
        name: 'Risk Management System',
        description: 'Automated risk controls and portfolio protection',
        category: 'risk',
        isEnabled: false,
        config: {
          maxDrawdown: 20,
          autoStopLoss: true,
          riskScoring: 'dynamic'
        },
        permissions: ['admin'],
        lastModified: new Date(),
        createdBy: 'system'
      }
    ];

    const mockCategories: FeatureCategory[] = [
      {
        id: 'trading',
        name: 'Trading Features',
        icon: <BarChart3 className="h-5 w-5" />,
        features: mockFeatures.filter(f => f.category === 'trading')
      },
      {
        id: 'social',
        name: 'Social Features',
        icon: <Users className="h-5 w-5" />,
        features: mockFeatures.filter(f => f.category === 'social')
      },
      {
        id: 'risk',
        name: 'Risk Management',
        icon: <Shield className="h-5 w-5" />,
        features: mockFeatures.filter(f => f.category === 'risk')
      },
      {
        id: 'analytics',
        name: 'Analytics & Reporting',
        icon: <TrendingUp className="h-5 w-5" />,
        features: mockFeatures.filter(f => f.category === 'analytics')
      }
    ];

    setFeatures(mockFeatures);
    setCategories(mockCategories);
  };

  const toggleFeature = (featureId: string, enabled: boolean) => {
    setFeatures(prev => prev.map(f => 
      f.id === featureId ? { ...f, isEnabled: enabled, lastModified: new Date() } : f
    ));
    
    toast({
      title: "Feature Updated",
      description: `Feature ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  };

  const saveFeatureConfig = (featureId: string, config: Record<string, any>) => {
    setFeatures(prev => prev.map(f => 
      f.id === featureId ? { ...f, config, lastModified: new Date() } : f
    ));
    
    toast({
      title: "Configuration Saved",
      description: "Feature configuration updated successfully",
    });
  };

  const createNewFeature = () => {
    try {
      const config = JSON.parse(newFeature.config);
      const permissions = newFeature.permissions.split(',').map(p => p.trim());
      
      const feature: DynamicFeature = {
        id: Date.now().toString(),
        name: newFeature.name,
        description: newFeature.description,
        category: newFeature.category,
        isEnabled: false,
        config,
        permissions,
        lastModified: new Date(),
        createdBy: 'admin'
      };

      setFeatures(prev => [...prev, feature]);
      setNewFeature({
        name: '',
        description: '',
        category: '',
        config: '{}',
        permissions: ''
      });

      toast({
        title: "Feature Created",
        description: "New feature added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid configuration JSON",
        variant: "destructive",
      });
    }
  };

  const deleteFeature = (featureId: string) => {
    setFeatures(prev => prev.filter(f => f.id !== featureId));
    toast({
      title: "Feature Deleted",
      description: "Feature removed successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-display">Dynamic Feature Manager</h2>
          <p className="text-purple-300">Configure and manage platform features dynamically</p>
        </div>
        <Badge className="bg-green-600 text-white">
          <Zap className="h-4 w-4 mr-2" />
          {features.filter(f => f.isEnabled).length} Active Features
        </Badge>
      </div>

      <Tabs defaultValue="features" className="space-y-4">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="features">Feature Management</TabsTrigger>
          <TabsTrigger value="create">Create Feature</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          <div className="grid gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    {category.icon}
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {features.filter(f => f.category === category.id).map((feature) => (
                      <div key={feature.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={feature.isEnabled}
                              onCheckedChange={(checked) => toggleFeature(feature.id, checked)}
                            />
                            <div>
                              <h4 className="text-white font-semibold">{feature.name}</h4>
                              <p className="text-purple-300 text-sm">{feature.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={feature.isEnabled ? 'bg-green-600' : 'bg-red-600'}>
                              {feature.isEnabled ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedFeature(feature);
                                setIsEditing(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteFeature(feature.id)}
                              className="border-red-500 text-red-400 hover:bg-red-600"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-purple-300">Permissions:</span>
                            <div className="flex gap-1 mt-1">
                              {feature.permissions.map(perm => (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-purple-300">Last Modified:</span>
                            <p className="text-white">{feature.lastModified.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-purple-300">Created By:</span>
                            <p className="text-white">{feature.createdBy}</p>
                          </div>
                        </div>

                        {feature.isEnabled && (
                          <div className="mt-3 p-3 bg-white/5 rounded border">
                            <h5 className="text-white font-semibold mb-2">Configuration</h5>
                            <pre className="text-purple-300 text-xs overflow-auto">
                              {JSON.stringify(feature.config, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Create New Feature</CardTitle>
              <CardDescription className="text-purple-300">
                Add a new dynamic feature to the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Feature Name</label>
                  <Input
                    value={newFeature.name}
                    onChange={(e) => setNewFeature({...newFeature, name: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Advanced Analytics"
                  />
                </div>
                <div>
                  <label className="text-white text-sm mb-2 block">Category</label>
                  <Select value={newFeature.category} onValueChange={(value) => setNewFeature({...newFeature, category: value})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trading">Trading Features</SelectItem>
                      <SelectItem value="social">Social Features</SelectItem>
                      <SelectItem value="risk">Risk Management</SelectItem>
                      <SelectItem value="analytics">Analytics & Reporting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-white text-sm mb-2 block">Description</label>
                <Textarea
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({...newFeature, description: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Feature description..."
                />
              </div>
              
              <div>
                <label className="text-white text-sm mb-2 block">Configuration (JSON)</label>
                <Textarea
                  value={newFeature.config}
                  onChange={(e) => setNewFeature({...newFeature, config: e.target.value})}
                  className="bg-white/5 border-white/10 text-white font-mono"
                  placeholder='{"key": "value"}'
                  rows={4}
                />
              </div>
              
              <div>
                <label className="text-white text-sm mb-2 block">Permissions (comma-separated)</label>
                <Input
                  value={newFeature.permissions}
                  onChange={(e) => setNewFeature({...newFeature, permissions: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="admin, premium_user, user"
                />
              </div>
              
              <Button onClick={createNewFeature} className="w-full bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Feature
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Total Features</p>
                    <p className="text-white text-2xl font-bold">{features.length}</p>
                  </div>
                  <Settings className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Active Features</p>
                    <p className="text-white text-2xl font-bold">{features.filter(f => f.isEnabled).length}</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Inactive Features</p>
                    <p className="text-white text-2xl font-bold">{features.filter(f => !f.isEnabled).length}</p>
                  </div>
                  <EyeOff className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Feature Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature) => (
                  <div key={feature.id} className="p-3 bg-white/5 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-white">{feature.name}</span>
                      <div className="flex items-center gap-4">
                        <Badge className={feature.isEnabled ? 'bg-green-600' : 'bg-red-600'}>
                          {feature.isEnabled ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-purple-300 text-sm">
                          Modified: {feature.lastModified.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Configuration Modal would go here */}
    </div>
  );
};
