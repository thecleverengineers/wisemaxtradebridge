
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, User, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLink } from './AdminLink';
import { TempAdminAccess } from './TempAdminAccess';

interface AppHeaderProps {
  onMenuClick: () => void;
}

export const AppHeader = ({ onMenuClick }: AppHeaderProps) => {
  const { user, signOut, profile } = useAuth();

  return (
    <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">IX</span>
            </div>
            <h1 className="text-xl font-display font-bold holographic-text">InvestX</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="flex items-center space-x-2 text-white">
                <Wallet className="h-4 w-4 text-purple-400" />
                <span className="font-mono text-sm">
                  ${profile?.total_investment?.toLocaleString() || '0'}
                </span>
              </div>
              
              <AdminLink />
              
              <div className="flex items-center space-x-2 text-white">
                <User className="h-4 w-4" />
                <span className="text-sm">{profile?.name || user.email}</span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="text-red-400 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {!user && <TempAdminAccess />}
        </div>
      </div>
    </header>
  );
};
