import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const USDTStakingManagement = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>USDT Staking Plans</CardTitle>
          <CardDescription>Manage staking plans and rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan Name</Label>
                <Input placeholder="e.g., Premium Staking" />
              </div>
              <div>
                <Label>APY (%)</Label>
                <Input type="number" placeholder="12.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Stake</Label>
                <Input type="number" placeholder="100" />
              </div>
              <div>
                <Label>Lock Period (days)</Label>
                <Input type="number" placeholder="30" />
              </div>
            </div>
            <Button>Create Staking Plan</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>APY</TableHead>
                <TableHead>Min Stake</TableHead>
                <TableHead>Lock Period</TableHead>
                <TableHead>Active Stakes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Flexible Staking</TableCell>
                <TableCell>8.5%</TableCell>
                <TableCell>$50</TableCell>
                <TableCell>No Lock</TableCell>
                <TableCell>234</TableCell>
                <TableCell>
                  <Badge variant="default">Active</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Premium Staking</TableCell>
                <TableCell>15%</TableCell>
                <TableCell>$500</TableCell>
                <TableCell>30 days</TableCell>
                <TableCell>89</TableCell>
                <TableCell>
                  <Badge variant="default">Active</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Stakes</CardTitle>
          <CardDescription>Monitor and manage user stakes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>user@example.com</TableCell>
                <TableCell>Premium Staking</TableCell>
                <TableCell>$1,000</TableCell>
                <TableCell>2024-01-01</TableCell>
                <TableCell>2024-01-31</TableCell>
                <TableCell>$12.50</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">View</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default USDTStakingManagement;