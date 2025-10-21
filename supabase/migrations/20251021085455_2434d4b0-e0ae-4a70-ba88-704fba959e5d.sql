-- Update existing superadmin roles to super-admin
UPDATE public.user_roles 
SET role = 'super-admin'::app_role 
WHERE role = 'superadmin'::app_role;