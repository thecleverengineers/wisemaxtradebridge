-- Add RLS policies for admin management of deposit wallets

-- Allow admins to insert deposit wallets
CREATE POLICY "Admins can insert deposit wallets"
ON public.deposit_wallets
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Allow admins to update deposit wallets
CREATE POLICY "Admins can update deposit wallets"
ON public.deposit_wallets
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Allow admins to delete deposit wallets
CREATE POLICY "Admins can delete deposit wallets"
ON public.deposit_wallets
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Allow admins to view all deposit wallets (not just active ones)
CREATE POLICY "Admins can view all deposit wallets"
ON public.deposit_wallets
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);