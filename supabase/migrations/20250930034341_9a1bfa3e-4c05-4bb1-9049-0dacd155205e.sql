-- Ensure investment_plans table has proper RLS setup
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Investment plans are public" ON public.investment_plans;

-- Create a simple public access policy
CREATE POLICY "Investment plans are public" 
ON public.investment_plans 
FOR SELECT 
USING (true);