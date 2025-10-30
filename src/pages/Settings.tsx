import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  CreditCard, 
  Phone,
  Mail,
  Camera,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

const Settings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile form
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    email: user?.email || ''
  });

  // Security form
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    investmentAlerts: true,
    roiAlerts: true,
    referralAlerts: true
  });

  // KYC form
  const [kycData, setKycData] = useState({
    panNumber: '',
    aadharNumber: '',
    usdtWallet: ''
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        phone: profile.phone || '',
        email: user?.email || ''
      });
    }
  }, [profile, user]);

  const handleProfileUpdate = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          phone: profileData.phone
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed", 
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password don't match",
        variant: "destructive",
      });
      return;
    }

    if (securityData.newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: securityData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully",
      });

      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Password Update Failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKYCSubmit = async () => {
    if (!kycData.panNumber || !kycData.aadharNumber || !kycData.usdtWallet) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required KYC details including USDT wallet address",
        variant: "destructive",
      });
      return;
    }

    // Validate USDT wallet address (BEP20 format - starts with 0x)
    if (!kycData.usdtWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: "Invalid Wallet Address",
        description: "Please enter a valid BEP20 wallet address (starts with 0x)",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_pan_number: kycData.panNumber,
          kyc_aadhar_number: kycData.aadharNumber,
          kyc_usdt_wallet: kycData.usdtWallet,
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "KYC Submitted",
        description: "Your KYC documents have been submitted for verification",
      });
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "KYC Submission Failed",
        description: "Failed to submit KYC documents. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 pt-20 pb-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Manage your account preferences and security
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-primary-foreground font-bold text-2xl">
                        {profileData.name.substring(0, 2).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <Button variant="outline">
                        <Camera className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                      <p className="text-muted-foreground text-sm mt-2">
                        JPG, GIF or PNG. 1MB max.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={profileData.email}
                          disabled
                          className="pl-10 opacity-60 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Referral Code</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={profile?.referral_code || ''}
                          disabled
                          className="opacity-60 cursor-not-allowed"
                        />
                        <Button variant="outline">
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleProfileUpdate}
                      size="lg"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-foreground font-semibold">Change Password</h3>
                    
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPassword ? 'text' : 'password'}
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                      />
                    </div>

                    <Button 
                      onClick={handlePasswordChange}
                      disabled={!securityData.currentPassword || !securityData.newPassword}
                      variant="destructive"
                    >
                      Update Password
                    </Button>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-foreground font-semibold mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-foreground font-medium">SMS Authentication</p>
                        <p className="text-muted-foreground text-sm">Secure your account with SMS codes</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-foreground font-semibold">General Notifications</h3>
                    
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                      { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                      { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in browser' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-foreground font-medium">{item.label}</p>
                          <p className="text-muted-foreground text-sm">{item.desc}</p>
                        </div>
                        <Switch 
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) => setNotifications({
                            ...notifications,
                            [item.key]: checked
                          })}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-foreground font-semibold mb-4">Investment Alerts</h3>
                    
                    {[
                      { key: 'investmentAlerts', label: 'Investment Updates', desc: 'Get notified about investment status changes' },
                      { key: 'roiAlerts', label: 'ROI Payments', desc: 'Get notified when ROI is credited' },
                      { key: 'referralAlerts', label: 'Referral Bonuses', desc: 'Get notified about referral earnings' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-3">
                        <div>
                          <p className="text-foreground font-medium">{item.label}</p>
                          <p className="text-muted-foreground text-sm">{item.desc}</p>
                        </div>
                        <Switch 
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) => setNotifications({
                            ...notifications,
                            [item.key]: checked
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KYC Tab */}
            <TabsContent value="kyc">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      KYC Verification
                    </div>
                    <Badge 
                      variant={
                        profile?.kyc_status === 'approved' ? 'default' :
                        profile?.kyc_status === 'pending' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {profile?.kyc_status || 'Not Submitted'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Complete your KYC verification to access all features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="pan-number">PAN Number *</Label>
                        <Input
                          id="pan-number"
                          value={kycData.panNumber}
                          onChange={(e) => setKycData({...kycData, panNumber: e.target.value.toUpperCase()})}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                        />
                      </div>

                      <div>
                        <Label htmlFor="aadhar-number">Aadhar Number *</Label>
                        <Input
                          id="aadhar-number"
                          value={kycData.aadharNumber}
                          onChange={(e) => setKycData({...kycData, aadharNumber: e.target.value})}
                          placeholder="1234 5678 9012"
                          maxLength={12}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="usdt-wallet">USDT Wallet Address (BEP20) *</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="usdt-wallet"
                          value={kycData.usdtWallet}
                          onChange={(e) => setKycData({...kycData, usdtWallet: e.target.value})}
                          placeholder="BEP20 wallet address (starts with 0x)"
                          className="pl-10"
                        />
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">
                        This address will be used for withdrawals
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="text-foreground font-medium mb-2">Required Information</h4>
                    <ul className="text-muted-foreground text-sm space-y-1">
                      <li>• PAN Card number (mandatory)</li>
                      <li>• Aadhar Card number (mandatory)</li>
                      <li>• USDT Wallet Address for withdrawals (mandatory)</li>
                      <li>• Ensure wallet address is correct as it cannot be changed after approval</li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleKYCSubmit}
                      disabled={!kycData.panNumber || !kycData.aadharNumber || !kycData.usdtWallet || profile?.kyc_status === 'approved'}
                      size="lg"
                    >
                      {profile?.kyc_status === 'approved' ? 'Already Verified' :
                       profile?.kyc_status === 'pending' ? 'Resubmit KYC' :
                       'Submit KYC'}
                    </Button>
                  </div>
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

export default Settings;
