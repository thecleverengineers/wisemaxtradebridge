
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Smartphone, Mail, Shield, Fingerprint, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { sendVerificationEmail } from '@/services/emailService';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step auth
  const [verificationCode, setVerificationCode] = useState(''); // Store generated code
  const [enteredCode, setEnteredCode] = useState(['', '', '', '', '', '']); // User input
  const [sendingEmail, setSendingEmail] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    referralCode: '',
    agreeToTerms: false,
    enableBiometric: false,
    enable2FA: false
  });

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate a random 6-digit verification code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send verification email
  const sendVerificationCode = async () => {
    setSendingEmail(true);
    try {
      const code = generateVerificationCode();
      setVerificationCode(code);
      
      await sendVerificationEmail(formData.email, code);
      
      toast({
        title: "Verification code sent!",
        description: `We've sent a 6-digit code to ${formData.email}`,
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Failed to send email",
        description: "Please check your email address and try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSendingEmail(false);
    }
  };

  // Verify the entered code
  const verifyCode = () => {
    const enteredCodeString = enteredCode.join('');
    if (enteredCodeString === verificationCode) {
      return true;
    }
    toast({
      title: "Invalid code",
      description: "The verification code you entered is incorrect.",
      variant: "destructive",
    });
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate('/advanced-dashboard');
      } else {
        if (step === 1) {
          // Move to verification step and send email
          const emailSent = await sendVerificationCode();
          if (emailSent) {
            setStep(2);
          }
          setLoading(false);
          return;
        }
        
        if (step === 2) {
          // Verify the code before creating account
          if (!verifyCode()) {
            setLoading(false);
            return;
          }
          
          // Create the account after successful verification
          await signUp(formData.email, formData.password, formData.name, formData.phone, formData.referralCode);
          toast({
            title: "Account created!",
            description: "Your email has been verified successfully.",
          });
          setStep(3); // KYC step
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle code input changes
  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }
    
    const newCode = [...enteredCode];
    newCode[index] = value;
    setEnteredCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace for code inputs
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !enteredCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const AuthStep1 = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name" className="text-white">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email" className="text-white">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/60"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone" className="text-white">Phone Number</Label>
        <div className="relative">
          <Smartphone className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
          <Input
            id="phone"
            type="tel"
            placeholder="+1 234 567 8900"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/60"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password" className="text-white">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/60"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="referralCode" className="text-white">Referral Code (Optional)</Label>
        <Input
          id="referralCode"
          type="text"
          placeholder="Enter referral code"
          value={formData.referralCode}
          onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
            className="border-white/20 data-[state=checked]:bg-purple-600"
          />
          <Label htmlFor="terms" className="text-sm text-white/80">
            I agree to the Terms of Service and Privacy Policy
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="biometric"
            checked={formData.enableBiometric}
            onCheckedChange={(checked) => setFormData({...formData, enableBiometric: checked as boolean})}
            className="border-white/20 data-[state=checked]:bg-purple-600"
          />
          <Label htmlFor="biometric" className="text-sm text-white/80 flex items-center">
            <Fingerprint className="w-4 h-4 mr-1" />
            Enable biometric authentication
          </Label>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        disabled={loading || !formData.agreeToTerms}
      >
        {loading ? 'Creating Account...' : 'Continue to Verification'}
      </Button>
    </form>
  );

  const AuthStep2 = () => {
    const handleVerifyClick = () => {
      if (verifyCode()) {
        // Proceed with account creation
        handleSubmit(new Event('submit') as any);
      }
    };

    const handleResendCode = async () => {
      setEnteredCode(['', '', '', '', '', '']);
      await sendVerificationCode();
    };

    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Verify Your Identity</h3>
          <p className="text-purple-300">We've sent a verification code to {formData.email}</p>
        </div>
        
        <div className="grid grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <Input
              key={i}
              ref={(el) => codeInputRefs.current[i] = el}
              type="text"
              maxLength={1}
              value={enteredCode[i]}
              onChange={(e) => handleCodeInput(i, e.target.value)}
              onKeyDown={(e) => handleCodeKeyDown(i, e)}
              className="text-center bg-white/5 border-white/10 text-white h-12 text-lg font-mono"
              placeholder="·"
            />
          ))}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleVerifyClick}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
            disabled={enteredCode.join('').length !== 6 || loading}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-purple-300"
            onClick={handleResendCode}
            disabled={sendingEmail}
          >
            {sendingEmail ? 'Sending...' : 'Resend Code'}
          </Button>
        </div>
      </div>
    );
  };

  const AuthStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
        <Camera className="w-8 h-8 text-white" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Complete KYC Verification</h3>
        <p className="text-purple-300">Upload your documents to start trading</p>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="font-medium text-white">Government ID</div>
              <div className="text-sm text-purple-300">Passport, Driver's License, or National ID</div>
            </div>
            <Button variant="outline" size="sm">Upload</Button>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="font-medium text-white">Proof of Address</div>
              <div className="text-sm text-purple-300">Utility bill or bank statement</div>
            </div>
            <Button variant="outline" size="sm">Upload</Button>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="font-medium text-white">Selfie Verification</div>
              <div className="text-sm text-purple-300">Live photo for identity confirmation</div>
            </div>
            <Button variant="outline" size="sm">Take Photo</Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={() => navigate('/advanced-dashboard')}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600"
        >
          Complete Registration
        </Button>
        <Button variant="ghost" className="w-full text-purple-300">
          Skip for Now (Limited Access)
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">IX</span>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isLogin ? 'Welcome Back' : step === 1 ? 'Join InvestX Pro' : step === 2 ? 'Verify Account' : 'Complete Setup'}
          </CardTitle>
          <CardDescription className="text-purple-300">
            {isLogin ? 'Sign in to your premium account' : step === 1 ? 'Create your AI-powered investment account' : step === 2 ? 'Security verification required' : 'Unlock full platform access'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'signup'} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 mb-6">
              <TabsTrigger 
                value="login" 
                onClick={() => {setIsLogin(true); setStep(1);}}
                className="data-[state=active]:bg-purple-600"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                onClick={() => {setIsLogin(false); setStep(1);}}
                className="data-[state=active]:bg-purple-600"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/60"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/60"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="biometric-login"
                    className="border-white/20 data-[state=checked]:bg-purple-600"
                  />
                  <Label htmlFor="biometric-login" className="text-sm text-white/80 flex items-center">
                    <Fingerprint className="w-4 h-4 mr-1" />
                    Use biometric login
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                
                <Button variant="ghost" className="w-full text-purple-400">
                  Forgot Password?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              {step === 1 && <AuthStep1 />}
              {step === 2 && <AuthStep2 />}
              {step === 3 && <AuthStep3 />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
