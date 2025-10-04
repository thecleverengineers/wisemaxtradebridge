-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update all transactions" ON public.transactions;

-- Create new policies that include both admin and super_admin roles
CREATE POLICY "Admins and Super Admins can view all transactions"
ON public.transactions
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::text) OR 
  has_role(auth.uid(), 'super_admin'::text)
);

CREATE POLICY "Admins and Super Admins can update all transactions"
ON public.transactions
FOR UPDATE
TO public
USING (
  has_role(auth.uid(), 'admin'::text) OR 
  has_role(auth.uid(), 'super_admin'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::text) OR 
  has_role(auth.uid(), 'super_admin'::text)
);