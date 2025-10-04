-- Add RLS policies for admins to manage transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
TO public
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all transactions"
ON public.transactions
FOR UPDATE
TO public
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));