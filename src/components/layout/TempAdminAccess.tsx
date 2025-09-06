
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const TempAdminAccess = () => {
  const [accessCode, setAccessCode] = useState('');
  const [showAccess, setShowAccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Temporary admin access code - change this in production
  const TEMP_ADMIN_CODE = 'INVESTX_ADMIN_2024';

  const handleTempAccess = () => {
    if (accessCode === TEMP_ADMIN_CODE) {
      // Store temporary admin flag in localStorage
      localStorage.setItem('temp_admin_access', 'true');
      toast({
        title: "Temporary Admin Access Granted",
        description: "You now have admin privileges for this session.",
      });
      navigate('/admin');
    } else {
      toast({
        title: "Invalid Access Code",
        description: "Please check your admin access code.",
        variant: "destructive",
      });
    }
  };

  if (!showAccess) {
    return (
      <Button
        onClick={() => setShowAccess(true)}
        variant="ghost"
        size="sm"
        className="text-purple-300 hover:text-white"
      >
        <Key className="h-4 w-4 mr-2" />
        Admin Access
      </Button>
    );
  }

  return (
    <Card className="glass-card w-80">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-400" />
          Temporary Admin Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="password"
          placeholder="Enter admin access code"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          className="bg-white/5 border-white/10 text-white"
        />
        <div className="flex gap-2">
          <Button onClick={handleTempAccess} className="flex-1 bg-purple-600 hover:bg-purple-700">
            Access Admin
          </Button>
          <Button onClick={() => setShowAccess(false)} variant="outline" className="border-white/20">
            Cancel
          </Button>
        </div>
        <p className="text-xs text-purple-300">
          Use code: <code className="bg-white/10 px-1 rounded">INVESTX_ADMIN_2024</code>
        </p>
      </CardContent>
    </Card>
  );
};
