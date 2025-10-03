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

interface InvestmentPlan {
  id: string;
  name: string;
  description: string | null;
  min_amount: number;
  max_amount: number;
  daily_roi: number;
  duration_days: number;
  total_return_percent: number;
  status: string;
  created_at: string;
}

const InvestmentPlansManagement = () => {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_amount: '',
    max_amount: '',
    daily_roi: '',
    duration_days: '',
    total_return_percent: '',
    status: 'active',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching investment plans:', error);
      toast({
        title: "Error",
        description: "Failed to load investment plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: InvestmentPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        min_amount: plan.min_amount.toString(),
        max_amount: plan.max_amount.toString(),
        daily_roi: plan.daily_roi.toString(),
        duration_days: plan.duration_days.toString(),
        total_return_percent: plan.total_return_percent.toString(),
        status: plan.status,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        min_amount: '',
        max_amount: '',
        daily_roi: '',
        duration_days: '',
        total_return_percent: '',
        status: 'active',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.min_amount || !formData.max_amount || !formData.daily_roi || !formData.duration_days) {
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
        min_amount: parseFloat(formData.min_amount),
        max_amount: parseFloat(formData.max_amount),
        daily_roi: parseFloat(formData.daily_roi),
        duration_days: parseInt(formData.duration_days),
        total_return_percent: parseFloat(formData.total_return_percent) || (parseFloat(formData.daily_roi) * parseInt(formData.duration_days)),
        status: formData.status,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('investment_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Investment plan updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('investment_plans')
          .insert(planData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Investment plan created successfully",
        });
      }

      handleCloseDialog();
      fetchPlans();
    } catch (error) {
      console.error('Error saving investment plan:', error);
      toast({
        title: "Error",
        description: "Failed to save investment plan",
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
        .from('investment_plans')
        .delete()
        .eq('id', deletingPlanId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Investment plan deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setDeletingPlanId(null);
      fetchPlans();
    } catch (error) {
      console.error('Error deleting investment plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete investment plan. It may be in use.",
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
              <CardTitle>Investment Plans Management</CardTitle>
              <CardDescription>Create, edit, and manage ROI investment plans</CardDescription>
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
                  <TableHead>Min - Max Amount</TableHead>
                  <TableHead>Daily ROI</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Total Return</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No investment plans found
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
                        ${plan.min_amount.toLocaleString()} - ${plan.max_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {plan.daily_roi}%
                      </TableCell>
                      <TableCell>{plan.duration_days} days</TableCell>
                      <TableCell className="font-semibold">
                        {plan.total_return_percent}%
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                          {plan.status.toUpperCase()}
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
            <DialogTitle>{editingPlan ? 'Edit Investment Plan' : 'Add Investment Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update the investment plan details' : 'Create a new investment plan'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Gold Plan"
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min_amount">Minimum Amount *</Label>
                <Input
                  id="min_amount"
                  type="number"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_amount">Maximum Amount *</Label>
                <Input
                  id="max_amount"
                  type="number"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  placeholder="10000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="daily_roi">Daily ROI (%) *</Label>
                <Input
                  id="daily_roi"
                  type="number"
                  step="0.01"
                  value={formData.daily_roi}
                  onChange={(e) => setFormData({ ...formData, daily_roi: e.target.value })}
                  placeholder="2.5"
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
              <Label htmlFor="total_return_percent">Total Return (%) *</Label>
              <Input
                id="total_return_percent"
                type="number"
                step="0.01"
                value={formData.total_return_percent}
                onChange={(e) => setFormData({ ...formData, total_return_percent: e.target.value })}
                placeholder="Auto-calculated if left empty"
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated as Daily ROI × Duration if not specified
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
              This will permanently delete this investment plan. This action cannot be undone.
              Active investments using this plan will not be affected.
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

export default InvestmentPlansManagement;
