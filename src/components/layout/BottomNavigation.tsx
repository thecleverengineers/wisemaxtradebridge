
import React from 'react';
import { Home, TrendingUp, Wallet, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: TrendingUp, label: 'Binary', path: '/binary-options', badge: true },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: Users, label: 'Referrals', path: '/referrals' },
  { icon: BarChart3, label: 'Forex', path: '/forex-trading' },
];

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[50]">
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 relative",
                  isActive 
                    ? "text-white" 
                    : "text-purple-400 hover:text-white"
                )}
              >
                <div className="relative">
                  <item.icon className={cn(
                    "h-6 w-6 transition-all duration-200",
                    isActive && "drop-shadow-lg"
                  )} />
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                  )}
                  
                  {isActive && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium transition-all duration-200",
                  isActive ? "text-white" : "text-purple-400"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
