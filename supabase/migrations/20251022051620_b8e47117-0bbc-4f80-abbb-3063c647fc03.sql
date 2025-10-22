-- Add admin policies for deposit_transactions
CREATE POLICY "Admins can view all deposit transactions"
ON public.deposit_transactions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role) OR
  has_role(auth.uid(), 'super-admin'::app_role)
);

CREATE POLICY "Admins can update deposit transactions"
ON public.deposit_transactions
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role) OR
  has_role(auth.uid(), 'super-admin'::app_role)
);