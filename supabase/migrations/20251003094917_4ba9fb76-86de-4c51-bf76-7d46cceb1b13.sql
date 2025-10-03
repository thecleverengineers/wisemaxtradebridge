-- Add RLS policies for super admins to view all users
CREATE POLICY "Super admins can view all users"
ON public.users
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Add RLS policies for super admins to update users
CREATE POLICY "Super admins can update all users"
ON public.users
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Add RLS policies for super admins to view all wallets
CREATE POLICY "Super admins can view all wallets"
ON public.wallets
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Add RLS policies for super admins to update all wallets
CREATE POLICY "Super admins can update all wallets"
ON public.wallets
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Add RLS policies for super admins to view all user roles
CREATE POLICY "Super admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Add RLS policies for super admins to manage user roles
CREATE POLICY "Super admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));