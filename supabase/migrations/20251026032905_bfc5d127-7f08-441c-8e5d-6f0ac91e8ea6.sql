-- Change investment_plans from range to fixed amount
-- Drop the old columns and add a single amount column
ALTER TABLE public.investment_plans 
  DROP COLUMN IF EXISTS min_amount,
  DROP COLUMN IF EXISTS max_amount,
  ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0;

-- Update the column to not have default after adding it
ALTER TABLE public.investment_plans 
  ALTER COLUMN amount DROP DEFAULT;

COMMENT ON COLUMN public.investment_plans.amount IS 'Fixed investment amount for this plan';