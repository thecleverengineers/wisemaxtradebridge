
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, TrendingUp, Users, Copy, Search, Filter } from 'lucide-react';

const SocialTrading = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const topTraders = [
    {
      id: 1,
      name: "Alex Chen",
      username: "@alextrader",
      avatar: "/placeholder.svg",
      verified: true,
      followers: 2847,
      return: 156.7,
      winRate: 87.5,
      riskScore: 4.2,
      bio: "Tech-focused momentum trader with 8+ years experience",
      totalTrades: 1247,
      avgHoldTime: "3.2 days",
      copyFee: 2.5,
      isFollowing: false
    },
    {
      id: 2,
      name: "Sarah Martinez",
      username: "@sarahfx",
      avatar: "/placeholder.svg",
      verified: true,
      followers: 3921,
      return: 203.4,
      winRate: 82.1,
      riskScore: 6.8,
      bio: "Forex specialist with algorithmic strategies",
      totalTrades: 2156,
      avgHoldTime: "1.8 days",
      copyFee: 3.0,
      isFollowing: true
    },
    {
      id: 3,
      name: "Mike Johnson",
      username: "@cryptomike",
      avatar: "/placeholder.svg",
      verified: false,
      followers: 1652,
      return: 89.3,
      winRate: 76.4,
      riskScore: 7.5,
      bio: "Crypto DeFi and altcoin investment strategies",
      totalTrades: 892,
      avgHoldTime: "5.1 days",
      copyFee: 1.8,
      isFollowing: false
    }
  ];

  const myFollowing = [
    {
      id: 1,
      name: "Sarah Martinez",
      allocation: 25,
      performance: 12.5,
      totalPnL: 1250,
      activeTrades: 3
    },
    {
      id: 2,
      name: "David Kim",
      allocation: 15,
      performance: -2.3,
      totalPnL: -345,
      activeTrades: 1
    }
  ];

  const recentActivity = [
    {
      trader: "Alex Chen",
      action: "Bought NVDA",
      amount: "$5,200",
      time: "2 minutes ago",
      followers: 47
    },
    {
      trader: "Sarah Martinez",
      action: "Sold TSLA",
      amount: "$3,800",
      time: "5 minutes ago",
      followers: 32
    },
    {
      trader: "Mike Johnson",
      action: "Bought BTC",
      amount: "$2,100",
      time: "8 minutes ago",
      followers: 18
    }
  ];

  const handleFollowTrader = (traderId: number) => {
    // Implementation for following a trader
    console.log('Following trader:', traderId);
  };

  const handleCopyTrade = (traderId: number) => {
    // Implementation for copying trades
    console.log('Setting up copy trading for:', traderId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Trading</h2>
          <p className="text-gray-600">Follow top traders and copy their strategies</p>
        </div>
        <Button>
          <Users className="w-4 h-4 mr-2" />
          Become a Trader
        </Button>
      </div>

      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="activity">Live Activity</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search traders by name, strategy, or asset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {topTraders.map((trader) => (
              <Card key={trader.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={trader.avatar} />
                      <AvatarFallback>{trader.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{trader.name}</h3>
                        {trader.verified && (
                          <Badge variant="default" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{trader.username}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{trader.bio}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Total Return</div>
                      <div className="font-bold text-green-600">+{trader.return}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Win Rate</div>
                      <div className="font-bold">{trader.winRate}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Followers</div>
                      <div className="font-bold">{trader.followers.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Risk Score</div>
                      <div className="font-bold">{trader.riskScore}/10</div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Copy Fee:</span>
                      <span className="font-medium">{trader.copyFee}% per trade</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg. Hold Time:</span>
                      <span className="font-medium">{trader.avgHoldTime}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant={trader.isFollowing ? "secondary" : "default"}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleFollowTrader(trader.id)}
                    >
                      {trader.isFollowing ? "Following" : "Follow"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopyTrade(trader.id)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="following" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Copy Trading Portfolio</CardTitle>
              <CardDescription>Manage your followed traders and allocations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myFollowing.map((follow, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>{follow.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{follow.name}</div>
                        <div className="text-sm text-gray-600">{follow.allocation}% allocation • {follow.activeTrades} active trades</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${follow.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {follow.performance >= 0 ? '+' : ''}{follow.performance}%
                      </div>
                      <div className={`text-sm ${follow.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {follow.totalPnL >= 0 ? '+' : ''}${follow.totalPnL}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Trading Activity</CardTitle>
              <CardDescription>Real-time trades from traders you follow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <div className="font-medium">{activity.trader} {activity.action}</div>
                        <div className="text-sm text-gray-600">{activity.time} • {activity.followers} followers copying</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{activity.amount}</div>
                      <Button variant="outline" size="sm" className="mt-1">
                        Copy Trade
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Monthly leaderboard of best performing traders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topTraders.sort((a, b) => b.return - a.return).map((trader, index) => (
                  <div key={trader.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <Avatar>
                      <AvatarImage src={trader.avatar} />
                      <AvatarFallback>{trader.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{trader.name}</div>
                      <div className="text-sm text-gray-600">{trader.followers.toLocaleString()} followers</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+{trader.return}%</div>
                      <div className="text-sm text-gray-600">{trader.winRate}% win rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialTrading;
