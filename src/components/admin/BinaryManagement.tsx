import React from 'react';
import BinaryManagementRecords from './BinaryManagementRecords';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const BinaryManagement = () => {
  return (
    <div className="space-y-6">
      {/* Binary Trading Records Component */}
      <BinaryManagementRecords />
      
      {/* Binary Options Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Binary Options Settings</CardTitle>
          <CardDescription>Configure binary trading parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Trading Enabled</Label>
            <Switch defaultChecked />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min Trade Amount</Label>
              <Input type="number" defaultValue="10" />
            </div>
            <div>
              <Label>Max Trade Amount</Label>
              <Input type="number" defaultValue="5000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Default Payout Rate (%)</Label>
              <Input type="number" defaultValue="85" />
            </div>
            <div>
              <Label>Max Daily Trades</Label>
              <Input type="number" defaultValue="100" />
            </div>
          </div>
          <Button>Save Settings</Button>
        </CardContent>
      </Card>

      {/* Active Binary Trades (Legacy View) */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Trade Control</CardTitle>
          <CardDescription>Legacy view for quick trade management</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>user@example.com</TableCell>
                <TableCell>EUR/USD</TableCell>
                <TableCell>
                  <Badge variant="default">CALL</Badge>
                </TableCell>
                <TableCell>$100</TableCell>
                <TableCell>1.0850</TableCell>
                <TableCell>5 min</TableCell>
                <TableCell>
                  <Badge variant="secondary">Pending</Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">Control</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BinaryManagement;