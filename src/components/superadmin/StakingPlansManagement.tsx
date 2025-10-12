import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';

interface StakingPlan {
  id: string;
  name: string;
  description: string | null;
  type: string;
  min_amount: number;
  max_amount: number;
  apy: number;
  duration_days: number;
  bonus_text: string | null;
  is_active: boolean;
  created_at: string;
}

const StakingPlansManagement = () => {
  const [plans, setPlans] = useState<StakingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StakingPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'flexible',
    min_amount: '',
    max_amount: '',
    apy: '',
    duration_days: '',
    bonus_text: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staking_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const plansWithTypes = (data || []).map(plan => ({
        ...plan,
        type: 'flexible',
        apy: plan.daily_return * 365,
        bonus_text: '',
        is_active: plan.status === 'active'
      }));
      setPlans(plansWithTypes as any);
    } catch (error) {
      console.error('Error fetching staking plans:', error);
      toast({
        title: "Error",
        description: "Failed to load staking plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: StakingPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        type: plan.type,
        min_amount: plan.min_amount.toString(),
        max_amount: plan.max_amount.toString(),
        apy: plan.apy.toString(),
        duration_days: plan.duration_days.toString(),
        bonus_text: plan.bonus_text || '',
        is_active: plan.is_active,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        type: 'flexible',
        min_amount: '',
        max_amount: '',
        apy: '',
        duration_days: '',
        bonus_text: '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.min_amount || !formData.max_amount || !formData.apy || !formData.duration_days) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const planData = {
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        min_amount: parseFloat(formData.min_amount),
        max_amount: parseFloat(formData.max_amount),
        apy: parseFloat(formData.apy),
        duration_days: parseInt(formData.duration_days),
        bonus_text: formData.bonus_text || null,
        is_active: formData.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('staking_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Staking plan updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('staking_plans')
          .insert(planData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Staking plan created successfully",
        });
      }

      handleCloseDialog();
      fetchPlans();
    } catch (error) {
      console.error('Error saving staking plan:', error);
      toast({
        title: "Error",
        description: "Failed to save staking plan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlanId) return;

    try {
      const { error } = await supabase
        .from('staking_plans')
        .delete()
        .eq('id', deletingPlanId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staking plan deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setDeletingPlanId(null);
      fetchPlans();
    } catch (error) {
      console.error('Error deleting staking plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete staking plan. It may be in use.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (planId: string) => {
    setDeletingPlanId(planId);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>USDT Staking Plans Management</CardTitle>
              <CardDescription>Create, edit, and manage USDT staking plans</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Min - Max Stake</TableHead>
                  <TableHead>APY</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Bonus Text</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No staking plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{plan.name}</span>
                          {plan.description && (
                            <span className="text-xs text-muted-foreground">{plan.description}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.type === 'flexible' ? 'default' : 'secondary'}>
                          {plan.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${plan.min_amount.toLocaleString()} - ${plan.max_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {plan.apy}%
                      </TableCell>
                      <TableCell>
                        {plan.duration_days} days
                      </TableCell>
                      <TableCell>
                        {plan.bonus_text || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => openDeleteDialog(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Staking Plan' : 'Add Staking Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update the staking plan details' : 'Create a new staking plan'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Flexible Staking"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plan description..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Plan Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="flexible">Flexible</option>
                <option value="locked">Locked</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min_amount">Minimum Stake *</Label>
                <Input
                  id="min_amount"
                  type="number"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_amount">Maximum Stake *</Label>
                <Input
                  id="max_amount"
                  type="number"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  placeholder="100000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="apy">APY (%) *</Label>
                <Input
                  id="apy"
                  type="number"
                  step="0.01"
                  value={formData.apy}
                  onChange={(e) => setFormData({ ...formData, apy: e.target.value })}
                  placeholder="12.5"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration_days">Duration (Days) *</Label>
                <Input
                  id="duration_days"
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bonus_text">Bonus Text</Label>
              <Input
                id="bonus_text"
                value={formData.bonus_text}
                onChange={(e) => setFormData({ ...formData, bonus_text: e.target.value })}
                placeholder="e.g., +5% APY bonus"
              />
              <p className="text-xs text-muted-foreground">
                Optional promotional text to display with this plan
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="is_active">Status</Label>
              <select
                id="is_active"
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Plan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this staking plan. This action cannot be undone.
              Active staking positions using this plan will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPlanId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StakingPlansManagement;
