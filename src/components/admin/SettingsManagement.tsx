
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  data_type: string;
  is_public: boolean;
}

export const SettingsManagement = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    description: '',
    category: 'general',
    data_type: 'string',
    is_public: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingId: string, key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('id', settingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Setting ${key} updated successfully`,
      });
      
      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const createSetting = async () => {
    try {
      const { error } = await supabase
        .from('settings')
        .insert([newSetting]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Setting created successfully",
      });
      
      setNewSetting({
        key: '',
        value: '',
        description: '',
        category: 'general',
        data_type: 'string',
        is_public: false
      });
      
      fetchSettings();
    } catch (error) {
      console.error('Error creating setting:', error);
      toast({
        title: "Error",
        description: "Failed to create setting",
        variant: "destructive",
      });
    }
  };

  const deleteSetting = async (settingId: string) => {
    try {
      const { error } = await supabase
        .from('settings')
        .delete()
        .eq('id', settingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Setting deleted successfully",
      });
      
      fetchSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast({
        title: "Error",
        description: "Failed to delete setting",
        variant: "destructive",
      });
    }
  };

  const categories = ['general', 'investment', 'referral', 'security', 'notifications', 'api'];
  
  const groupedSettings = categories.reduce((acc, category) => {
    acc[category] = settings.filter(s => s.category === category);
    return acc;
  }, {} as Record<string, Setting[]>);

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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Settings</h1>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Export Settings
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{category} Settings</CardTitle>
                <CardDescription>
                  Configure {category} related system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupedSettings[category]?.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-1">
                      <Label className="text-sm font-medium">{setting.key}</Label>
                      {setting.description && (
                        <p className="text-xs text-slate-500">{setting.description}</p>
                      )}
                      <div className="flex items-center space-x-2">
                        {setting.data_type === 'boolean' ? (
                          <Switch
                            checked={setting.value === 'true'}
                            onCheckedChange={(checked) => 
                              updateSetting(setting.id, setting.key, checked.toString())
                            }
                          />
                        ) : setting.data_type === 'number' ? (
                          <Input
                            type="number"
                            value={setting.value}
                            onChange={(e) => updateSetting(setting.id, setting.key, e.target.value)}
                            className="w-32"
                          />
                        ) : (
                          <Input
                            value={setting.value}
                            onChange={(e) => updateSetting(setting.id, setting.key, e.target.value)}
                            className="w-64"
                          />
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSetting(setting.id, setting.key, setting.value)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSetting(setting.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {groupedSettings[category]?.length === 0 && (
                  <p className="text-slate-500 text-center py-8">
                    No settings found for this category
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Add New Setting</CardTitle>
          <CardDescription>Create a new system setting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Key</Label>
              <Input
                value={newSetting.key}
                onChange={(e) => setNewSetting({...newSetting, key: e.target.value})}
                placeholder="setting_key"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={newSetting.category}
                onValueChange={(value) => setNewSetting({...newSetting, category: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Type</Label>
              <Select
                value={newSetting.data_type}
                onValueChange={(value) => setNewSetting({...newSetting, data_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                value={newSetting.value}
                onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                placeholder="Setting value"
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={newSetting.description}
              onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
              placeholder="Setting description (optional)"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={newSetting.is_public}
              onCheckedChange={(checked) => setNewSetting({...newSetting, is_public: checked})}
            />
            <Label>Public Setting</Label>
          </div>
          <Button onClick={createSetting} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create Setting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
