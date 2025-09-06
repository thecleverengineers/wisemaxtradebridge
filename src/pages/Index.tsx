
import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Zap, Shield, TrendingUp, Brain, Globe, Layers } from 'lucide-react';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 pulse-glow">
            <span className="text-white font-display font-bold text-2xl">IX</span>
          </div>
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-300 font-body">Initializing InvestX Platform...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/30 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center">
          {/* Hero Section */}
          <div className="mb-12 space-y-8">
            <div className="floating">
              <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 pulse-glow">
                <span className="text-white font-display font-bold text-3xl">IX</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-display font-bold holographic-text leading-tight">
                InvestX
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 font-body max-w-2xl mx-auto leading-relaxed">
                Ultra-futuristic AI-powered trading platform designed for the next generation of investors
              </p>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl">
            <div className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
              <Brain className="w-12 h-12 mx-auto mb-4 text-purple-400 group-hover:text-purple-300" />
              <h3 className="text-xl font-display font-bold text-white mb-2">AI Trading</h3>
              <p className="text-slate-400 font-body">Advanced algorithms analyze markets in real-time</p>
            </div>
            
            <div className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
              <Shield className="w-12 h-12 mx-auto mb-4 text-green-400 group-hover:text-green-300" />
              <h3 className="text-xl font-display font-bold text-white mb-2">Secure Platform</h3>
              <p className="text-slate-400 font-body">Bank-level security with advanced encryption</p>
            </div>
            
            <div className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
              <Globe className="w-12 h-12 mx-auto mb-4 text-blue-400 group-hover:text-blue-300" />
              <h3 className="text-xl font-display font-bold text-white mb-2">Global Markets</h3>
              <p className="text-slate-400 font-body">Access worldwide financial markets 24/7</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="space-y-6 max-w-lg w-full">
            <Button
              onClick={() => navigate('/auth')}
              className="neon-button w-full h-14 text-lg font-display font-semibold"
            >
              Launch Platform
            </Button>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-slate-500 font-mono">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Premium Features</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span>AI Powered</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl">
            <div className="text-center">
              <div className="text-3xl font-display font-bold holographic-text">50K+</div>
              <div className="text-slate-400 font-mono text-sm">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold holographic-text">$2.5B</div>
              <div className="text-slate-400 font-mono text-sm">Volume Traded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold holographic-text">99.9%</div>
              <div className="text-slate-400 font-mono text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <DashboardContent />
        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
};

export default Index;
