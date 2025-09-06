-- Create admin user (if you haven't created one yet)
-- You need to first sign up a user through the app, then run this to make them admin
-- Replace 'your-user-id' with the actual user ID from the auth.users table

-- Example: To make the first user an admin (uncomment and modify as needed)
-- INSERT INTO public.user_roles (user_id, role) 
-- SELECT id, 'admin' FROM auth.users LIMIT 1
-- ON CONFLICT DO NOTHING;