
import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/laktoken-logo.jpg';

interface AppHeaderProps {
  onMenuClick: () => void;
}

export const AppHeader = ({ onMenuClick }: AppHeaderProps) => {
  const { user, profile, isAdmin, isSuperAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    // Navigation is handled in the signOut function
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-white hover:bg-white/10"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center space-x-2">
            <img src={logo} alt="LakToken Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <span className="text-white font-bold text-lg">LakToken</span>
              {isSuperAdmin ? (
                <Badge 
                  className="ml-2 bg-purple-600 text-white text-xs cursor-pointer hover:bg-purple-700 transition-colors"
                  onClick={() => navigate('/superadmin')}
                >
                  Super Admin
                </Badge>
              ) : isAdmin ? (
                <Badge className="ml-2 bg-yellow-500 text-black text-xs">
                  Admin
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 relative"
          >
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </Button>
          
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-white hover:bg-white/10"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/auth')}
              className="text-white hover:bg-white/10"
              title="Sign In"
            >
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
