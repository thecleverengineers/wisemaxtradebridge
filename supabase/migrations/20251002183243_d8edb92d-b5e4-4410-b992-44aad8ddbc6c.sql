-- Update existing role to super_admin for thecleverengineers@gmail.com
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'thecleverengineers@gmail.com'
  LIMIT 1
);