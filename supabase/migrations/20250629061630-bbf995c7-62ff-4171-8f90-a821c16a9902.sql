
-- First, let's check if you already have a role and update it, or insert a new one
-- Replace 'your-email@example.com' with your actual email address

-- Delete existing role for your user (if any)
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- Insert the super_admin role
INSERT INTO public.user_roles (user_id, role) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
  'super_admin'
);
