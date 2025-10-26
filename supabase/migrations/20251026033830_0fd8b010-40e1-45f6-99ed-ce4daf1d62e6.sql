-- Fix RLS policies for user_roles table to allow super-admins to manage roles
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage roles" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow super-admins to view all roles
CREATE POLICY "Superadmins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow super-admins to insert roles
CREATE POLICY "Superadmins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role)
);

-- Allow super-admins to update roles
CREATE POLICY "Superadmins can update roles"
ON public.user_roles
FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role)
);

-- Allow super-admins to delete roles
CREATE POLICY "Superadmins can delete roles"
ON public.user_roles
FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role)
);

-- Fix wallets RLS policies for super-admin access
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.wallets;

CREATE POLICY "Admins can view all wallets"
ON public.wallets
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update all wallets"
ON public.wallets
FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Fix transactions RLS for super-admin insert access
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;

CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can insert transactions"
ON public.transactions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);