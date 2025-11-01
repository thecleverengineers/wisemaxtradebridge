-- Update RLS policies for profiles table to allow super-admins to update KYC status
CREATE POLICY "Superadmins can update KYC status"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role)
);