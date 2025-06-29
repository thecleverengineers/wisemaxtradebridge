
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, Settings } from 'lucide-react';

export const AdminLink = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Button
      onClick={() => navigate('/admin')}
      variant="outline"
      size="sm"
      className="bg-gradient-primary border-purple-500/50 text-white hover:bg-purple-600 transition-all"
    >
      <Shield className="h-4 w-4 mr-2" />
      Admin Panel
    </Button>
  );
};
