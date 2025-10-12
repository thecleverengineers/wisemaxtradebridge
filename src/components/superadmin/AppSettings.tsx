import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, ExternalLink } from 'lucide-react';

const AppSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supportLink, setSupportLink] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'support_link')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.setting_value) {
        if (typeof data.setting_value === 'object' && 'url' in data.setting_value) {
          setSupportLink((data.setting_value.url as string) || '');
        } else if (typeof data.setting_value === 'string') {
          setSupportLink(data.setting_value);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supportLink.trim()) {
      toast({
        title: "Validation Error",
        description: "Support link cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(supportLink);
    } catch {
      toast({
        title: "Validation Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'support_link',
          setting_value: supportLink
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Support link updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
          <CardDescription>
            Manage global application settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="supportLink">Support Link</Label>
            <div className="flex gap-2">
              <Input
                id="supportLink"
                type="url"
                placeholder="https://t.me/+3esl2Tswpc1mZGRk"
                value={supportLink}
                onChange={(e) => setSupportLink(e.target.value)}
                className="flex-1"
              />
              {supportLink && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(supportLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              This link will appear in the sidebar for all users. Typically a Telegram support channel.
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppSettings;
