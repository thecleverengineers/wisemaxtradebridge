
import React from 'react';
import { Menu, Bell, User, LogOut, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface AppHeaderProps {
  onMenuClick: () => void;
}

export const AppHeader = ({ onMenuClick }: AppHeaderProps) => {
  const { user, profile, isAdmin, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-glass backdrop-blur-2xl border-b border-glass">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-white hover:bg-white/10 rounded-xl"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center pulse-glow">
              <span className="text-white font-display font-bold text-lg">IX</span>
            </div>
            <div>
              <span className="text-white font-display font-bold text-xl">InvestX</span>
              {isAdmin && (
                <Badge className="ml-3 bg-gradient-accent text-white text-xs font-mono">
                  ADMIN
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* AI Status Indicator */}
          <div className="hidden md:flex items-center space-x-2 glass-card px-3 py-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-mono text-slate-300">AI ACTIVE</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 relative rounded-xl"
          >
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </Button>
          
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-white hover:bg-white/10 rounded-xl"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-xl"
            >
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
