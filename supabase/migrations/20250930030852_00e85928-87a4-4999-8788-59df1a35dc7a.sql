-- Drop existing staking_positions if it doesn't match our schema
DROP TABLE IF EXISTS public.staking_positions CASCADE;

-- Create staking plans table
CREATE TABLE public.staking_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flexible', 'locked')),
  duration_days INTEGER NOT NULL DEFAULT 0,
  apy NUMERIC NOT NULL,
  min_amount NUMERIC NOT NULL DEFAULT 1,
  max_amount NUMERIC NOT NULL DEFAULT 1000000,
  description TEXT,
  bonus_text TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create staking positions table with correct schema
CREATE TABLE public.staking_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.staking_plans(id),
  amount NUMERIC NOT NULL,
  apy NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('flexible', 'locked')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,
  total_earned NUMERIC DEFAULT 0,
  last_payout_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create staking earnings ledger
CREATE TABLE public.staking_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  position_id UUID NOT NULL REFERENCES public.staking_positions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  earned_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staking_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staking_plans (public read)
CREATE POLICY "Staking plans are public" 
ON public.staking_plans 
FOR SELECT 
USING (true);

-- RLS Policies for staking_positions
CREATE POLICY "Users can view their own positions" 
ON public.staking_positions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own positions" 
ON public.staking_positions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions" 
ON public.staking_positions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for staking_earnings  
CREATE POLICY "Users can view their own earnings" 
ON public.staking_earnings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Insert default staking plans
INSERT INTO public.staking_plans (name, type, duration_days, apy, min_amount, max_amount, description, bonus_text)
VALUES 
  ('Flexible Staking', 'flexible', 0, 3.5, 1, 1000000, 'Withdraw anytime with daily rewards', NULL),
  ('7 Days Locked', 'locked', 7, 5.0, 10, 1000000, '7 days lock-up period', NULL),
  ('30 Days Locked', 'locked', 30, 7.5, 10, 1000000, '30 days lock-up period', '🎁 +0.5% Bonus APY'),
  ('60 Days Locked', 'locked', 60, 9.0, 10, 1000000, '60 days lock-up period', NULL),
  ('90 Days Locked', 'locked', 90, 12.0, 10, 1000000, '90 days lock-up period', '🚀 +1% Bonus APY');

-- Create trigger to update timestamps
CREATE TRIGGER update_staking_positions_updated_at
BEFORE UPDATE ON public.staking_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();