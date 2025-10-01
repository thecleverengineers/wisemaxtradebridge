import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
  const [marketSettings, setMarketSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketSettings();
  }, []);

  const fetchMarketSettings = async () => {
    try {
      const { data } = await supabase
        .from('binary_market_settings')
        .select('*')
        .single();
      setMarketSettings(data);
    } catch (error) {
      console.error('Error fetching market settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMarketSettings = async (field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('binary_market_settings')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', marketSettings.id);

      if (error) throw error;
      
      toast.success('Market settings updated');
      fetchMarketSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  if (loading) {
    return <Card className="p-6">Loading admin dashboard...</Card>;
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Admin Dashboard
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Market Mode</Label>
          <Select
            value={marketSettings?.market_mode}
            onValueChange={(value) => updateMarketSettings('market_mode', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="random">Random</SelectItem>
              <SelectItem value="signal">Signal Based</SelectItem>
              <SelectItem value="algorithm">Algorithm</SelectItem>
              <SelectItem value="admin">Admin Control</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Global Payout Multiplier</Label>
          <Input
            type="number"
            value={marketSettings?.global_payout_multiplier}
            onChange={(e) => updateMarketSettings('global_payout_multiplier', parseFloat(e.target.value))}
            step="0.01"
            min="0.5"
            max="2"
          />
        </div>

        <div className="space-y-2">
          <Label>Trading Enabled</Label>
          <Button
            variant={marketSettings?.is_trading_enabled ? "default" : "destructive"}
            onClick={() => updateMarketSettings('is_trading_enabled', !marketSettings?.is_trading_enabled)}
          >
            {marketSettings?.is_trading_enabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Maintenance Mode</Label>
          <Button
            variant={marketSettings?.maintenance_mode ? "destructive" : "outline"}
            onClick={() => updateMarketSettings('maintenance_mode', !marketSettings?.maintenance_mode)}
          >
            {marketSettings?.maintenance_mode ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>
    </Card>
  );
};