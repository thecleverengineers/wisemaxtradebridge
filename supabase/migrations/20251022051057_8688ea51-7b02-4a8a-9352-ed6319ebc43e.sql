-- Add INSERT policy for transactions table so users can create their own transactions
CREATE POLICY "Users can create their own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);