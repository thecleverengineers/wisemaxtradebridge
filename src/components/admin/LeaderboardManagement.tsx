import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';

const LeaderboardManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard Management</CardTitle>
        <CardDescription>View and manage user rankings</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Total Profit</TableHead>
              <TableHead>Win Rate</TableHead>
              <TableHead>Trades</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  1
                </div>
              </TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>$5,234</TableCell>
              <TableCell>68%</TableCell>
              <TableCell>156</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LeaderboardManagement;