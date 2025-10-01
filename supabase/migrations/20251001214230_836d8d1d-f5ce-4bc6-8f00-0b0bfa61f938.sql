-- Update the user role to admin for thecleverengineers@gmail.com
UPDATE user_roles
SET role = 'admin'
WHERE user_id = '77cb13c7-230b-4e13-8567-f32c65f7d664';

-- Verify the update
SELECT 
  u.email,
  ur.role,
  u.created_at
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'thecleverengineers@gmail.com';