-- Update RLS policy for admin_settings to allow both admin and super_admin roles
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;

CREATE POLICY "Admins and Super Admins can manage settings"
ON public.admin_settings
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::text) OR 
  has_role(auth.uid(), 'super_admin'::text)
);