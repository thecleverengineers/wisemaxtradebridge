
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Smartphone, Mail, Zap, Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    referralCode: ''
  });

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Validate login fields
        if (!formData.email || !formData.password) {
          toast({
            title: "Missing Information",
            description: "Please enter both email and password.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email.trim(), formData.password);
        if (!error) {
          toast({
            title: "Welcome back to InvestX",
            description: "Successfully signed in to your premium trading account.",
          });
          // Navigation is handled by AuthContext and ProtectedRoute
        } else {
          // Error already handled by signIn function
          setLoading(false);
        }
      } else {
        // Validate signup fields
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Password validation
        if (formData.password.length < 6) {
          toast({
            title: "Weak Password",
            description: "Password must be at least 6 characters long.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(
          formData.email.trim(), 
          formData.password, 
          formData.name.trim(),
          formData.phone.trim(),
          formData.referralCode?.trim()
        );
        if (!error) {
          toast({
            title: "Welcome to InvestX Premium",
            description: "Your account has been created. Please check your email to verify your account.",
          });
          // Clear form after successful signup
          setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            referralCode: ''
          });
          setIsLogin(true); // Switch to login tab
        } else {
          // Error already handled by signUp function
          setLoading(false);
        }
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    } finally {
      // Only set loading to false if there was no successful auth
      if (isLogin) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="glass-card border-glass backdrop-blur-2xl">
          <CardHeader className="text-center space-y-6">
            <div className="mx-auto">
              <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 pulse-glow">
                <span className="text-white font-display font-bold text-2xl">IX</span>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-display font-bold holographic-text">
                  {isLogin ? 'Welcome Back' : 'Join InvestX'}
                </CardTitle>
                <CardDescription className="text-slate-300 font-body">
                  {isLogin ? 'Access your premium trading platform' : 'Create your premium AI-powered trading account'}
                </CardDescription>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <span className="text-xs text-slate-400 font-mono">AI Trading</span>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-green-400" />
                <span className="text-xs text-slate-400 font-mono">Secure</span>
              </div>
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <span className="text-xs text-slate-400 font-mono">Premium</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={isLogin ? 'login' : 'signup'} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 rounded-xl">
                <TabsTrigger 
                  value="login" 
                  onClick={() => setIsLogin(true)}
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white font-semibold"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  onClick={() => setIsLogin(false)}
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white font-semibold"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-6 mt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200 font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="futuristic-input pl-11 h-12 text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200 font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="futuristic-input pr-11 h-12 text-white placeholder:text-slate-500"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="neon-button w-full h-12 font-semibold font-display"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      'Access Platform'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-6 mt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200 font-medium">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="futuristic-input h-12 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-200 font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="futuristic-input pl-11 h-12 text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-200 font-medium">Phone Number</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="futuristic-input pl-11 h-12 text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-200 font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="futuristic-input pr-11 h-12 text-white placeholder:text-slate-500"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-slate-200 font-medium">Referral Code <span className="text-slate-500">(Optional)</span></Label>
                    <Input
                      id="referralCode"
                      type="text"
                      placeholder="Enter referral code for bonuses"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                      className="futuristic-input h-12 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="neon-button w-full h-12 font-semibold font-display"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      'Join InvestX Premium'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500 font-mono">
                Powered by advanced AI • Institutional-grade security
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
