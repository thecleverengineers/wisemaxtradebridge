-- First, check if users already have roles and update them
UPDATE public.user_roles 
SET role = 'super_admin'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('admin@laktoken.com', 'thecleverengineers@gmail.com')
);

-- Insert only if they don't exist yet
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email IN ('admin@laktoken.com', 'thecleverengineers@gmail.com')
  AND id NOT IN (SELECT user_id FROM public.user_roles);