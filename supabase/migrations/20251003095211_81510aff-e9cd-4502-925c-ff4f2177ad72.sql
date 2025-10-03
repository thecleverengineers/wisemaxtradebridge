-- Drop the recursive policy that's causing infinite recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;