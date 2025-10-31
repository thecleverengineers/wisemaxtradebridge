
import React, { useEffect, useState } from 'react';
import { X, Home, TrendingUp, Wallet, Users, Settings, LogOut, Gift, Calculator, Award, Shield, BarChart3, DollarSign, PiggyBank, Copy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/wisemax-logo.png';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppSidebar = ({ isOpen, onClose }: AppSidebarProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin } = useSuperAdmin();
  const [supportLink, setSupportLink] = useState<string>('');
  const [telegramLink, setTelegramLink] = useState<string>('');

  useEffect(() => {
    const fetchLinks = async () => {
      const { data: supportData } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'support_link')
        .maybeSingle();

      if (supportData?.setting_value) {
        const value = supportData.setting_value as string | { url: string } | null;
        if (value !== null) {
          if (typeof value === 'object' && value && 'url' in value) {
            const urlValue = value.url;
            if (urlValue && typeof urlValue === 'string') {
              setSupportLink(urlValue);
            }
          } else if (typeof value === 'string') {
            setSupportLink(value);
          }
        }
      }

      const { data: telegramData } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'telegram_support_link')
        .maybeSingle();

      if (telegramData?.setting_value) {
        const value = telegramData.setting_value as string | { url: string } | null;
        if (value !== null) {
          if (typeof value === 'object' && value && 'url' in value) {
            const urlValue = value.url;
            if (urlValue && typeof urlValue === 'string') {
              setTelegramLink(urlValue);
            }
          } else if (typeof value === 'string') {
            setTelegramLink(value);
          }
        }
      }
    };

    fetchLinks();
  }, []);

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    ...(isSuperAdmin ? [{ 
      icon: Shield, 
      label: 'Super Admin', 
      path: '/superadmin', 
      badge: 'SUPER ADMIN',
      badgeColor: 'destructive' as const 
    }] : []),
    { icon: BarChart3, label: 'Forex Trading', path: '/forex-trading' },
    { icon: DollarSign, label: 'USDT Staking', path: '/usdt-staking', badge: 'New' },
    { icon: PiggyBank, label: 'ROI Investments', path: '/roi-investments', badge: 'HOT' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', badge: `₹${profile?.total_investment?.toLocaleString() || '0'}` },
    { icon: Users, label: 'Referrals', path: '/referrals' },
    { icon: Calculator, label: 'Calculator', path: '/calculator' },
    { icon: Award, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Gift, label: 'Rewards', path: '/rewards' },
    { icon: DollarSign, label: 'Monthly Salary', path: '/salary', badge: 'NEW' },
    { icon: TrendingUp, label: 'Investment Records', path: '/investment-records' },
  ];

  const bottomMenuItems = [
    ...(telegramLink ? [{ icon: MessageCircle, label: 'Telegram Support', path: telegramLink, external: true }] : []),
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
    // Navigation is handled in the signOut function
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-card via-background to-card border-r border-border transform transition-transform duration-300 ease-in-out z-[80] flex flex-col overflow-hidden shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-2">
            <img src={logo} alt="WiseMax Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h2 className="font-bold text-base">WiseMax</h2>
              <p className="text-muted-foreground text-xs">Trade Bridge</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Profile - Fixed */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">
                {profile?.name?.substring(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{profile?.name || 'User'}</h3>
              <div className="flex items-center space-x-2">
              <p className="text-muted-foreground text-xs">
                {isSuperAdmin ? 'Super Admin' : 'Gold Member'}
              </p>
              {isSuperAdmin && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  Super Admin
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span className="text-primary text-xs">
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Referral Code Display */}
          {profile?.referral_code && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Referral Code</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {profile.referral_code}
                </code>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(profile.referral_code || '');
                    toast({
                      title: "Copied!",
                      description: "Referral code copied",
                    });
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items - Scrollable */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent">
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
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ml-2",
                      item.badgeColor === 'destructive' 
                        ? "bg-destructive text-destructive-foreground" 
                        : "bg-secondary text-secondary-foreground"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
            
            {/* Bottom Menu Items */}
            <div className="pt-2 mt-2 border-t border-border">
              {bottomMenuItems.map((item, index) => {
                if ('external' in item && item.external) {
                  return (
                    <a
                      key={index}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-all duration-200"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{item.label}</span>
                    </a>
                  );
                }
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Support & Logout - Fixed */}
        <div className="p-3 border-t border-border flex-shrink-0 space-y-1">
          {supportLink && (
            <a
              href={supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium text-sm">Support</span>
            </a>
          )}
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
