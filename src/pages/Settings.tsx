import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, User, Bell, Shield, CreditCard, HelpCircle, LogOut, ArrowLeft, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, profile, signOut, refreshProfile, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  });
  const [kycData, setKycData] = useState({
    aadhar_number: '',
    pan_number: '',
    bank_account: '',
    ifsc_code: '',
  });
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const updateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          phone: profileData.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });

      refreshProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitKyc = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          kyc_documents: kycData,
          kyc_status: 'pending',
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "KYC Submitted",
        description: "Your KYC documents have been submitted for verification",
      });

      refreshProfile();
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit KYC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 pt-20 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
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
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-purple-300">Manage your account preferences</p>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-purple-300">
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-white">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-white/5 border-white/10 text-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="referral-code" className="text-white">Referral Code</Label>
                <Input
                  id="referral-code"
                  value={profile?.referral_code || ''}
                  disabled
                  className="bg-white/5 border-white/10 text-gray-400"
                />
              </div>
            </div>
            <Button 
              onClick={updateProfile} 
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* KYC Verification */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                KYC Verification
              </div>
              <Badge className={`${
                profile?.kyc_status === 'approved' ? 'bg-green-500' :
                profile?.kyc_status === 'pending' ? 'bg-yellow-500' :
                profile?.kyc_status === 'rejected' ? 'bg-red-500' :
                'bg-gray-500'
              } text-white`}>
                {profile?.kyc_status || 'pending'}
              </Badge>
            </CardTitle>
            <CardDescription className="text-purple-300">
              Complete your KYC to unlock all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.kyc_status === 'approved' ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-green-400 font-semibold">KYC Verified</p>
                <p className="text-purple-300">Your account is fully verified</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="aadhar" className="text-white">Aadhar Number</Label>
                    <Input
                      id="aadhar"
                      placeholder="1234 5678 9012"
                      value={kycData.aadhar_number}
                      onChange={(e) => setKycData({...kycData, aadhar_number: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pan" className="text-white">PAN Number</Label>
                    <Input
                      id="pan"
                      placeholder="ABCDE1234F"
                      value={kycData.pan_number}
                      onChange={(e) => setKycData({...kycData, pan_number: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank" className="text-white">Bank Account Number</Label>
                    <Input
                      id="bank"
                      placeholder="1234567890"
                      value={kycData.bank_account}
                      onChange={(e) => setKycData({...kycData, bank_account: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifsc" className="text-white">IFSC Code</Label>
                    <Input
                      id="ifsc"
                      placeholder="ABCD0123456"
                      value={kycData.ifsc_code}
                      onChange={(e) => setKycData({...kycData, ifsc_code: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <Button 
                  onClick={submitKyc} 
                  disabled={loading || profile?.kyc_status === 'pending'}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? 'Submitting...' : 'Submit KYC'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription className="text-purple-300">
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-purple-300 text-sm">Receive updates via email</p>
              </div>
              <Switch
                checked={notifications.email_notifications}
                onCheckedChange={(checked) => setNotifications({...notifications, email_notifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">SMS Notifications</p>
                <p className="text-purple-300 text-sm">Receive updates via SMS</p>
              </div>
              <Switch
                checked={notifications.sms_notifications}
                onCheckedChange={(checked) => setNotifications({...notifications, sms_notifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Push Notifications</p>
                <p className="text-purple-300 text-sm">Receive browser notifications</p>
              </div>
              <Switch
                checked={notifications.push_notifications}
                onCheckedChange={(checked) => setNotifications({...notifications, push_notifications: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security
            </CardTitle>
            <CardDescription className="text-purple-300">
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10">
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Change Password</DialogTitle>
                  <DialogDescription className="text-purple-300">
                    Update your account password
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password" className="text-white">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password" className="text-white">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="text-white">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Update Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-purple-300 text-sm">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Account Actions</CardTitle>
            <CardDescription className="text-purple-300">
              Manage your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin && (
              <Button 
                variant="outline" 
                className="w-full justify-start bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20"
                onClick={() => navigate('/admin')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & Support
            </Button>
            
            <Button 
              onClick={handleSignOut}
              variant="outline" 
              className="w-full justify-start bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="text-center text-purple-300 text-sm space-y-1">
              <p>InvestX Platform v1.0</p>
              <p>© 2024 InvestX. All rights reserved.</p>
              <div className="flex justify-center space-x-4 mt-2">
                <button className="hover:text-white transition-colors">Privacy Policy</button>
                <button className="hover:text-white transition-colors">Terms of Service</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
