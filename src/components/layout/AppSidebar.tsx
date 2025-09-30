
import React from 'react';
import { X, Home, TrendingUp, Wallet, Users, Settings, LogOut, Gift, Calculator, Award, Shield, BarChart3, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppSidebar = ({ isOpen, onClose }: AppSidebarProps) => {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: BarChart3, label: 'Forex Trading', path: '/forex-trading' },
    { icon: DollarSign, label: 'USDT Staking', path: '/usdt-staking', badge: 'New' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', badge: `₹${profile?.total_investment?.toLocaleString() || '0'}` },
    { icon: Users, label: 'Referrals', path: '/referrals' },
    { icon: Calculator, label: 'Calculator', path: '/calculator' },
    { icon: Award, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Gift, label: 'Rewards', path: '/rewards' },
    { icon: Shield, label: 'Investment Records', path: '/investment-records' },
    { icon: TrendingUp, label: 'Intraday Trading', path: '/intraday-trading' },
    ...(isAdmin ? [{ icon: Shield, label: 'Admin Panel', path: '/admin' }] : []),
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 border-r border-white/10 transform transition-transform duration-300 ease-in-out z-50 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LT</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-base">LakToken</h2>
              <p className="text-purple-300 text-xs">Premium Trading</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Profile - Fixed */}
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {profile?.name?.substring(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{profile?.name || 'User'}</h3>
              <div className="flex items-center space-x-2">
                <p className="text-purple-300 text-xs">
                  {isAdmin ? 'Admin' : 'Gold Member'}
                </p>
                {isAdmin && (
                  <Badge className="bg-yellow-500 text-black text-xs px-1 py-0">
                    Admin
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-xs">
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items - Scrollable */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
          <div className="p-3 space-y-1">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25" 
                      : "text-purple-200 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ml-2">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout - Fixed */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
