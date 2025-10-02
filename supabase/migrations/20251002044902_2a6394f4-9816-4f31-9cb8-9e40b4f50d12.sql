-- Create USDT Staking Records table
CREATE TABLE IF NOT EXISTS public.usdtstaking_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('flexible', 'locked')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  apy NUMERIC NOT NULL CHECK (apy >= 0),
  duration_days INTEGER,
  stake_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  maturity_date TIMESTAMP WITH TIME ZONE,
  last_interest_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_earned NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn', 'expired')),
  auto_renew BOOLEAN DEFAULT false,
  withdrawn_amount NUMERIC DEFAULT 0,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  early_withdrawal BOOLEAN DEFAULT false,
  penalty_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usdtstaking_records_user_id ON public.usdtstaking_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usdtstaking_records_status ON public.usdtstaking_records(status);
CREATE INDEX IF NOT EXISTS idx_usdtstaking_records_maturity_date ON public.usdtstaking_records(maturity_date);

-- Enable Row Level Security
ALTER TABLE public.usdtstaking_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own staking records"
ON public.usdtstaking_records
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own staking records"
ON public.usdtstaking_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own staking records"
ON public.usdtstaking_records
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all staking records
CREATE POLICY "Admins can view all staking records"
ON public.usdtstaking_records
FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Admins can update all staking records
CREATE POLICY "Admins can update all staking records"
ON public.usdtstaking_records
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

-- Create trigger to update updated_at
CREATE TRIGGER update_usdtstaking_records_updated_at
BEFORE UPDATE ON public.usdtstaking_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate and update interest
CREATE OR REPLACE FUNCTION public.calculate_staking_interest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  days_elapsed NUMERIC;
  daily_rate NUMERIC;
  interest_earned NUMERIC;
BEGIN
  -- Only calculate for active records
  IF NEW.status = 'active' THEN
    -- Calculate days elapsed since last interest calculation
    days_elapsed := EXTRACT(EPOCH FROM (now() - NEW.last_interest_date)) / 86400;
    
    -- Calculate daily interest rate
    daily_rate := NEW.apy / 365 / 100;
    
    -- Calculate interest earned
    interest_earned := NEW.amount * daily_rate * days_elapsed;
    
    -- Update total earned and last interest date
    NEW.total_earned := COALESCE(NEW.total_earned, 0) + interest_earned;
    NEW.last_interest_date := now();
    
    -- Check if maturity date reached for locked staking
    IF NEW.plan_type = 'locked' AND NEW.maturity_date IS NOT NULL AND now() >= NEW.maturity_date THEN
      IF NEW.auto_renew THEN
        -- Auto-renew: reset dates
        NEW.stake_date := now();
        NEW.maturity_date := now() + (NEW.duration_days || ' days')::INTERVAL;
        NEW.status := 'active';
      ELSE
        -- Mark as completed
        NEW.status := 'completed';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for interest calculation
CREATE TRIGGER calculate_staking_interest_trigger
BEFORE UPDATE ON public.usdtstaking_records
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION public.calculate_staking_interest();

-- Create view for active staking summary
CREATE OR REPLACE VIEW public.user_staking_summary AS
SELECT 
  user_id,
  COUNT(*) as total_stakes,
  SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) as total_active_amount,
  SUM(CASE WHEN status = 'active' THEN total_earned ELSE 0 END) as total_active_earnings,
  SUM(total_earned) as total_all_time_earnings,
  MAX(stake_date) as last_stake_date,
  SUM(CASE WHEN plan_type = 'flexible' AND status = 'active' THEN amount ELSE 0 END) as flexible_amount,
  SUM(CASE WHEN plan_type = 'locked' AND status = 'active' THEN amount ELSE 0 END) as locked_amount
FROM public.usdtstaking_records
GROUP BY user_id;