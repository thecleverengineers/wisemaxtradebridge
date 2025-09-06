
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  Shield,
  Database,
  Activity,
  Bell,
  CreditCard,
  FileText,
  TrendingUp,
  Target,
  ChevronLeft,
  LogOut,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const AdminSidebar = ({ isOpen, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', exact: true },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: TrendingUp, label: 'Investments', path: '/admin/investments' },
    { icon: Wallet, label: 'Withdrawals', path: '/admin/withdrawals' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: CreditCard, label: 'Transactions', path: '/admin/transactions' },
    { icon: Target, label: 'Trading', path: '/admin/trading' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    { icon: FileText, label: 'Reports', path: '/admin/reports' },
    { icon: Activity, label: 'System Monitor', path: '/admin/monitor' },
    { icon: Database, label: 'Database', path: '/admin/database' },
    { icon: Shield, label: 'Features', path: '/admin/features' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        {isOpen && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Admin Panel</h2>
              <p className="text-xs text-slate-500">Control Center</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                active 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="font-medium">{item.label}</span>}
              {active && isOpen && <Badge variant="secondary" className="ml-auto">Active</Badge>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          {isOpen && 'Sign Out'}
        </Button>
      </div>
    </div>
  );
};
