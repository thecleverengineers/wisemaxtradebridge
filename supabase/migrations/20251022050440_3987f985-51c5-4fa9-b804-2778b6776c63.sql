-- Drop existing policies on deposit_wallets
DROP POLICY IF EXISTS "Admins can insert deposit wallets" ON public.deposit_wallets;
DROP POLICY IF EXISTS "Admins can update deposit wallets" ON public.deposit_wallets;
DROP POLICY IF EXISTS "Admins can delete deposit wallets" ON public.deposit_wallets;
DROP POLICY IF EXISTS "Admins can view all deposit wallets" ON public.deposit_wallets;

-- Recreate policies with super-admin role included
CREATE POLICY "Admins can insert deposit wallets"
ON public.deposit_wallets
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role) OR
  has_role(auth.uid(), 'super-admin'::app_role)
);

CREATE POLICY "Admins can update deposit wallets"
ON public.deposit_wallets
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role) OR
  has_role(auth.uid(), 'super-admin'::app_role)
);

CREATE POLICY "Admins can delete deposit wallets"
ON public.deposit_wallets
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role) OR
  has_role(auth.uid(), 'super-admin'::app_role)
);

CREATE POLICY "Admins can view all deposit wallets"
ON public.deposit_wallets
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role) OR
  has_role(auth.uid(), 'super-admin'::app_role)
);