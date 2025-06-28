
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Share2, 
  Gift, 
  Trophy,
  Copy,
  DollarSign,
  Star,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  tier: string;
  nextTierTarget: number;
  progress: number;
}

interface ReferralHistory {
  id: string;
  referredUser: string;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  earnings: number;
  level: number;
}

const mockReferralStats: ReferralStats = {
  totalReferrals: 42,
  activeReferrals: 38,
  totalEarnings: 15750,
  thisMonthEarnings: 2340,
  tier: 'Gold',
  nextTierTarget: 50,
  progress: 84
};

const mockReferralHistory: ReferralHistory[] = [
  {
    id: '1',
    referredUser: 'user***@gmail.com',
    joinDate: '2024-01-15',
    status: 'ACTIVE',
    earnings: 450,
    level: 1
  },
  {
    id: '2',
    referredUser: 'john***@yahoo.com',
    joinDate: '2024-01-10',
    status: 'ACTIVE',
    earnings: 1200,
    level: 1
  },
  {
    id: '3',
    referredUser: 'sarah***@gmail.com',
    joinDate: '2024-01-08',
    status: 'INACTIVE',
    earnings: 75,
    level: 2
  },
  {
    id: '4',
    referredUser: 'mike***@outlook.com',
    joinDate: '2024-01-05',
    status: 'ACTIVE',
    earnings: 890,
    level: 1
  }
];

const tierBenefits = {
  Bronze: { commission: 5, bonus: 0, color: 'from-orange-600 to-yellow-600' },
  Silver: { commission: 7, bonus: 500, color: 'from-gray-400 to-gray-600' },
  Gold: { commission: 10, bonus: 1000, color: 'from-yellow-500 to-orange-500' },
  Platinum: { commission: 12, bonus: 2000, color: 'from-purple-500 to-pink-500' },
  Diamond: { commission: 15, bonus: 5000, color: 'from-blue-500 to-cyan-500' }
};

export const ReferralSystem = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [referralStats, setReferralStats] = useState<ReferralStats>(mockReferralStats);
  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>(mockReferralHistory);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
    }
  }, [profile]);

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copied!",
      description: "Referral link has been copied to clipboard",
    });
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Code Copied!",
      description: "Referral code has been copied to clipboard",
    });
  };

  const shareReferral = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    const shareText = `Join InvestX and start your investment journey! Use my referral code: ${referralCode} or click: ${referralLink}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join InvestX',
        text: shareText,
        url: referralLink
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Share Text Copied!",
        description: "Share message has been copied to clipboard",
      });
    }
  };

  const currentTier = tierBenefits[referralStats.tier as keyof typeof tierBenefits];

  return (
    <div className="space-y-6">
      {/* Referral Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Referrals</p>
                <p className="text-2xl font-bold">{referralStats.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Referrals</p>
                <p className="text-2xl font-bold">{referralStats.activeReferrals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold">₹{referralStats.totalEarnings.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-600 to-red-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">This Month</p>
                <p className="text-2xl font-bold">₹{referralStats.thisMonthEarnings.toLocaleString()}</p>
              </div>
              <Gift className="h-8 w-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Tools */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Share2 className="h-5 w-5 mr-2" />
              Share & Earn
            </CardTitle>
            <CardDescription className="text-purple-300">
              Invite friends and earn commissions on their investments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-purple-300 text-sm">Your Referral Code</label>
              <div className="flex mt-2">
                <Input
                  value={referralCode}
                  readOnly
                  className="bg-white/5 border-white/10 text-white rounded-r-none"
                />
                <Button
                  onClick={copyReferralCode}
                  variant="outline"
                  className="border-white/10 rounded-l-none"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-purple-300 text-sm">Referral Link</label>
              <div className="flex mt-2">
                <Input
                  value={`${window.location.origin}/auth?ref=${referralCode}`}
                  readOnly
                  className="bg-white/5 border-white/10 text-white rounded-r-none text-sm"
                />
                <Button
                  onClick={copyReferralLink}
                  variant="outline"
                  className="border-white/10 rounded-l-none"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={shareReferral}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Referral
            </Button>
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Referral Tier Status
            </CardTitle>
            <CardDescription className="text-purple-300">
              Unlock higher commissions with more referrals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={`bg-gradient-to-r ${currentTier.color} text-white`}>
                <Star className="h-3 w-3 mr-1" />
                {referralStats.tier} Tier
              </Badge>
              <span className="text-white text-sm">{referralStats.totalReferrals}/{referralStats.nextTierTarget} referrals</span>
            </div>

            <Progress value={referralStats.progress} className="h-2" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-300">Commission Rate:</span>
                <span className="text-white">{currentTier.commission}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-300">Tier Bonus:</span>
                <span className="text-white">₹{currentTier.bonus.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-300">Next Tier:</span>
                <span className="text-white">{referralStats.nextTierTarget - referralStats.totalReferrals} more referrals</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral History */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Your Referrals
          </CardTitle>
          <CardDescription className="text-purple-300">
            Track your referred users and earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referralHistory.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <p className="text-purple-300">No referrals yet</p>
              <p className="text-purple-400 text-sm">Start sharing your referral code to earn commissions!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralHistory.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {referral.referredUser[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{referral.referredUser}</p>
                      <p className="text-purple-300 text-sm">
                        Joined: {new Date(referral.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-white font-semibold">₹{referral.earnings.toLocaleString()}</p>
                      <p className="text-purple-300 text-sm">Level {referral.level}</p>
                    </div>
                    <Badge className={referral.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'}>
                      {referral.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Structure */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Commission Structure
          </CardTitle>
          <CardDescription className="text-purple-300">
            Earn commissions on multiple levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">10%</div>
              <div className="text-white font-medium mb-1">Level 1</div>
              <div className="text-purple-300 text-sm">Direct referrals</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">5%</div>
              <div className="text-white font-medium mb-1">Level 2</div>
              <div className="text-purple-300 text-sm">Referrals of referrals</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-2">2%</div>
              <div className="text-white font-medium mb-1">Level 3</div>
              <div className="text-purple-300 text-sm">Third level referrals</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
