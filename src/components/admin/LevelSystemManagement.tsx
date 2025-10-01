import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LevelSystemManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Level System Configuration</CardTitle>
        <CardDescription>Set up user level progression</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Required Investment</TableHead>
              <TableHead>Bonus Rate</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Level 1</TableCell>
              <TableCell>$0</TableCell>
              <TableCell>0%</TableCell>
              <TableCell>
                <Button size="sm" variant="outline">Edit</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LevelSystemManagement;