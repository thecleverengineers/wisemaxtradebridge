import React from 'react';
import { Activity, Users, Lock, Database, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'roles', label: 'Role Management', icon: Lock },
  { id: 'activity', label: 'Activity Log', icon: Database },
  { id: 'settings', label: 'App Settings', icon: Settings },
];

export const AdminSidebar = ({ activeSection, onSectionChange }: AdminSidebarProps) => {
  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0">
      <nav className="p-4 space-y-1">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <section.icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{section.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
