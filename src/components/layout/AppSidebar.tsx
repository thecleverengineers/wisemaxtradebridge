
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  TrendingUp, 
  Wallet, 
  Users, 
  Settings, 
  Calculator, 
  Trophy, 
  Gift,
  FileText,
  BarChart3,
  Activity,
  X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppSidebar = ({ isOpen, onClose }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: TrendingUp, label: 'Invest', path: '/invest' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: FileText, label: 'Investment Records', path: '/investment-records' },
    { icon: BarChart3, label: 'Intraday Trading', path: '/intraday-trading' },
    { icon: Activity, label: 'MT5 Trading', path: '/mt5-trading' },
    { icon: Users, label: 'Referrals', path: '/referrals' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Gift, label: 'Rewards', path: '/rewards' },
    { icon: Calculator, label: 'Calculator', path: '/calculator' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-slate-800 border-r border-white/10 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IX</span>
              </div>
              <div>
                <h2 className="text-white font-semibold">InvestX</h2>
                <p className="text-purple-300 text-sm">Premium Trading</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{user.email}</p>
                  <p className="text-purple-300 text-sm">Premium Member</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`w-full justify-start text-left space-x-3 ${
                    isActive 
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' 
                      : 'text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleItemClick(item.path)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:bg-red-500/10"
              onClick={handleSignOut}
            >
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
