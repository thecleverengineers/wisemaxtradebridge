
import React from 'react';
import { TrendingUp, Wallet, Users, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const DashboardContent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 pb-20">
      <div className="px-4 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Welcome Back!</h1>
              <p className="text-purple-300">Your portfolio is looking great today</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-purple-600 to-blue-600 border-0 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold opacity-90">Total Balance</h2>
            <Wallet className="h-5 w-5 opacity-90" />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-bold">₹1,24,580</h3>
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="h-4 w-4 text-green-300" />
              <span className="text-green-300 text-sm font-medium">+12.5% this month</span>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white/5 backdrop-blur-md border-white/10 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-green-400 text-sm font-medium">ROI Earned</p>
                <p className="text-white text-lg font-bold">₹24,580</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border-white/10 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-blue-400 text-sm font-medium">Active Plans</p>
                <p className="text-white text-lg font-bold">4</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border-white/10 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-purple-400 text-sm font-medium">Referrals</p>
                <p className="text-white text-lg font-bold">127</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border-white/10 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Gift className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-400 text-sm font-medium">Rewards</p>
                <p className="text-white text-lg font-bold">₹5,240</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Investment Plans */}
        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold">Investment Plans</h3>
          
          {[
            { amount: "₹10,000", roi: "₹1,000/day", plan: "Premium Plan", progress: 85 },
            { amount: "₹5,000", roi: "₹500/day", plan: "Gold Plan", progress: 65 },
            { amount: "₹1,000", roi: "₹100/day", plan: "Silver Plan", progress: 45 },
          ].map((investment, index) => (
            <Card key={index} className="bg-white/5 backdrop-blur-md border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold">{investment.plan}</h4>
                  <p className="text-purple-300 text-sm">Investment: {investment.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">{investment.roi}</p>
                  <p className="text-purple-300 text-sm">Daily ROI</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300">Progress</span>
                  <span className="text-white">{investment.progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${investment.progress}%` }}
                  ></div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold">Recent Activity</h3>
          
          {[
            { type: "ROI Credit", amount: "+₹1,000", time: "2 hours ago", icon: ArrowUpRight, color: "text-green-400" },
            { type: "Investment", amount: "-₹5,000", time: "1 day ago", icon: ArrowDownRight, color: "text-blue-400" },
            { type: "Referral Bonus", amount: "+₹500", time: "2 days ago", icon: Gift, color: "text-yellow-400" },
          ].map((transaction, index) => (
            <Card key={index} className="bg-white/5 backdrop-blur-md border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${transaction.color.replace('text-', 'bg-').replace('-400', '-500/20')} rounded-lg flex items-center justify-center`}>
                    <transaction.icon className={`h-5 w-5 ${transaction.color}`} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.type}</p>
                    <p className="text-purple-300 text-sm">{transaction.time}</p>
                  </div>
                </div>
                <p className={`font-semibold ${transaction.color}`}>{transaction.amount}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
