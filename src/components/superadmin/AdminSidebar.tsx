import React from 'react';
import { Activity, Users, Lock, Database, Settings, ChevronLeft, ChevronRight, TrendingUp, PiggyBank, Briefcase, DollarSign, Layers, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const sections = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'roles', label: 'Role Management', icon: Lock },
  { id: 'binary', label: 'Binary Records', icon: TrendingUp },
  { id: 'forex', label: 'Forex Records', icon: BarChart3 },
  { id: 'roi', label: 'ROI Investments', icon: PiggyBank },
  { id: 'usdt', label: 'USDT Staking', icon: DollarSign },
  { id: 'plans', label: 'Investment Plans', icon: Briefcase },
  { id: 'staking-plans', label: 'Staking Plans', icon: Layers },
  { id: 'activity', label: 'Activity Log', icon: Database },
  { id: 'settings', label: 'App Settings', icon: Settings },
];

export const AdminSidebar = ({ activeSection, onSectionChange, isCollapsed, onToggle }: AdminSidebarProps) => {
  return (
    <aside className={cn(
      "bg-card border-r border-border flex-shrink-0 transition-all duration-300 ease-in-out relative",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Toggle Button */}
      <div className={cn(
        "absolute -right-3 top-6 z-10",
        isCollapsed && "right-2"
      )}>
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full bg-background shadow-md"
          onClick={onToggle}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      <nav className="p-4 space-y-1">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full flex items-center rounded-lg transition-all duration-200 text-left",
                isCollapsed ? "justify-center px-2 py-3" : "space-x-3 px-4 py-3",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={isCollapsed ? section.label : undefined}
            >
              <section.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{section.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
