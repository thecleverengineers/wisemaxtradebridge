import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ReferralManagement = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Referral Commission Settings</CardTitle>
          <CardDescription>Configure multi-level commission rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((level) => (
              <div key={level} className="flex items-center gap-4">
                <Label className="w-24">Level {level}</Label>
                <Input 
                  type="number" 
                  placeholder="Commission %" 
                  defaultValue={level === 1 ? "5" : level === 2 ? "2.5" : level === 3 ? "1.5" : "1"}
                  className="w-32"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            ))}
            <Button>Save Commission Rates</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral Network</CardTitle>
          <CardDescription>View user referral relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referred User</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Total Deposits</TableHead>
                <TableHead>Commission Earned</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>john@example.com</TableCell>
                <TableCell>jane@example.com</TableCell>
                <TableCell>Level 1</TableCell>
                <TableCell>$2,000</TableCell>
                <TableCell>$100</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralManagement;