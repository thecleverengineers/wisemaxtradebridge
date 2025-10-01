import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('binary_leaderboard')
        .select('*')
        .eq('period', 'daily')
        .eq('period_start', new Date().toISOString().split('T')[0])
        .order('total_profit', { ascending: false })
        .limit(10);

      setLeaders(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Daily Leaderboard</h3>
      {loading ? (
        <div className="text-center text-muted-foreground py-8">Loading...</div>
      ) : leaders.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No data yet</div>
      ) : (
        <div className="space-y-2">
          {leaders.map((leader, index) => (
            <div key={leader.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getRankIcon(index + 1)}
                <span>User #{leader.user_id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{leader.win_rate?.toFixed(1)}%</Badge>
                <span className="font-semibold">${leader.total_profit?.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};