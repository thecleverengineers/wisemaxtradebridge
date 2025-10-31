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
  const [telegramLink, setTelegramLink] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data: supportData, error: supportError } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'support_link')
        .maybeSingle();

      if (supportError && supportError.code !== 'PGRST116') {
        throw supportError;
      }

      if (supportData?.setting_value) {
        const value = supportData.setting_value as string | { url: string } | null;
        if (value !== null) {
          if (typeof value === 'object' && value && 'url' in value) {
            const urlValue = value.url;
            if (urlValue && typeof urlValue === 'string') {
              setSupportLink(urlValue);
            }
          } else if (typeof value === 'string') {
            setSupportLink(value);
          }
        }
      }

      const { data: telegramData, error: telegramError } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'telegram_support_link')
        .maybeSingle();

      if (telegramError && telegramError.code !== 'PGRST116') {
        throw telegramError;
      }

      if (telegramData?.setting_value) {
        const value = telegramData.setting_value as string | { url: string } | null;
        if (value !== null) {
          if (typeof value === 'object' && value && 'url' in value) {
            const urlValue = value.url;
            if (urlValue && typeof urlValue === 'string') {
              setTelegramLink(urlValue);
            }
          } else if (typeof value === 'string') {
            setTelegramLink(value);
          }
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
    // Validate URLs
    if (supportLink.trim()) {
      try {
        new URL(supportLink);
      } catch {
        toast({
          title: "Validation Error",
          description: "Please enter a valid support URL",
          variant: "destructive",
        });
        return;
      }
    }

    if (telegramLink.trim()) {
      try {
        new URL(telegramLink);
      } catch {
        toast({
          title: "Validation Error",
          description: "Please enter a valid Telegram URL",
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      const updates = [];
      
      if (supportLink.trim()) {
        updates.push(
          supabase
            .from('admin_settings')
            .upsert({
              setting_key: 'support_link',
              setting_value: supportLink
            })
        );
      }

      if (telegramLink.trim()) {
        updates.push(
          supabase
            .from('admin_settings')
            .upsert({
              setting_key: 'telegram_support_link',
              setting_value: telegramLink
            })
        );
      }

      const results = await Promise.all(updates);
      
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      toast({
        title: "Success",
        description: "Settings updated successfully",
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
            <Label htmlFor="telegramLink">Telegram Support Link</Label>
            <div className="flex gap-2">
              <Input
                id="telegramLink"
                type="url"
                placeholder="https://t.me/yoursupport"
                value={telegramLink}
                onChange={(e) => setTelegramLink(e.target.value)}
                className="flex-1"
              />
              {telegramLink && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(telegramLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              This Telegram link will appear in the sidebar before Settings for all users.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportLink">General Support Link</Label>
            <div className="flex gap-2">
              <Input
                id="supportLink"
                type="url"
                placeholder="https://support.example.com"
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
              This link will appear at the bottom of the sidebar for all users.
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
