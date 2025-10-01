import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';

const BinaryControl = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Binary Trade Control</CardTitle>
          <CardDescription>Manually control trade outcomes for specific users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive">
              Warning: Use this feature responsibly. Manual intervention should be minimal and justified.
            </p>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trade ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Force Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs">abc123</TableCell>
                <TableCell>user@example.com</TableCell>
                <TableCell>EUR/USD</TableCell>
                <TableCell>
                  <Badge variant="default">CALL</Badge>
                </TableCell>
                <TableCell>$100</TableCell>
                <TableCell>
                  <Badge variant="secondary">Pending</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Win
                    </Button>
                    <Button size="sm" variant="destructive">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      Lose
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Market Mode Settings</CardTitle>
          <CardDescription>Configure how market behaves</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Market Mode</Label>
              <Select defaultValue="random">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random (Fair)</SelectItem>
                  <SelectItem value="favor_house">Favor House</SelectItem>
                  <SelectItem value="favor_user">Favor User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>Save Market Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BinaryControl;