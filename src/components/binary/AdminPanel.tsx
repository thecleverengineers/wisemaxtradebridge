import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const AdminPanel: React.FC = () => {
  const [autoMode, setAutoMode] = useState(true);
  const [generatingSignal, setGeneratingSignal] = useState(false);

  const generateManualSignal = async (signalType: 'CALL' | 'PUT') => {
    setGeneratingSignal(true);
    try {
      const assetPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];
      const randomPair = assetPairs[Math.floor(Math.random() * assetPairs.length)];
      
      // Deactivate all existing signals
      await supabase
        .from('binary_signals')
        .update({ is_active: false })
        .eq('is_active', true);

      // Create new signal
      const { error } = await supabase
        .from('binary_signals')
        .insert({
          asset_pair: randomPair,
          signal_type: signalType,
          strength: 'strong',
          expires_at: new Date(Date.now() + 15000).toISOString(),
          is_active: true,
          admin_forced: true
        });

      if (error) throw error;

      toast.success(`Manual ${signalType} signal generated for ${randomPair}`);
    } catch (error: any) {
      toast.error('Failed to generate signal: ' + error.message);
    } finally {
      setGeneratingSignal(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-yellow-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-500">
          <Shield className="h-5 w-5" />
          Admin Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-mode" className="flex items-center gap-2">
            <span>Auto-Random Signals</span>
          </Label>
          <Switch
            id="auto-mode"
            checked={autoMode}
            onCheckedChange={setAutoMode}
          />
        </div>

        {!autoMode && (
          <div className="space-y-3 pt-4 border-t border-border/50">
            <Label>Manual Signal Override</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => generateManualSignal('CALL')}
                disabled={generatingSignal}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Force CALL
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => generateManualSignal('PUT')}
                disabled={generatingSignal}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Force PUT
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Manual signals override auto-generation for 15 seconds
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Mode: {autoMode ? 'Auto-Random' : 'Manual Control'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};