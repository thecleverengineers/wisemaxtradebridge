
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarContent, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Menu, Search, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
  const { user, profile } = useAuth();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search admin panel..."
                className="pl-10 w-80 bg-slate-50 dark:bg-slate-800 border-0"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* System Status */}
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            System Online
          </Badge>
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500">
              3
            </Badge>
          </Button>
          
          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="h-5 w-5" />
          </Button>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback className="bg-blue-600 text-white">
                {profile?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {profile?.name || 'Admin User'}
              </p>
              <p className="text-xs text-slate-500">Super Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
