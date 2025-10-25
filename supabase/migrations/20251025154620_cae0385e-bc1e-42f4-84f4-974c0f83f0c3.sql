-- Allow admins to view all profiles (for displaying user info in admin panels)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role)
);