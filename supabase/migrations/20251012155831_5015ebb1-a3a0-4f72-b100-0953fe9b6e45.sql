-- Create salary payments tracking table
CREATE TABLE public.salary_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_tier TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_month INTEGER NOT NULL CHECK (payment_month >= 1 AND payment_month <= 6),
  tier_reached_at TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add tier_reached_at to user_achievement_progress
ALTER TABLE public.user_achievement_progress 
ADD COLUMN tier_reached_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salary_payments
CREATE POLICY "Users can view their own salary payments"
ON public.salary_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_salary_payments_user_id ON public.salary_payments(user_id);
CREATE INDEX idx_salary_payments_tier ON public.salary_payments(achievement_tier);

-- Create function to get current achievement tier
CREATE OR REPLACE FUNCTION public.get_user_achievement_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_deposits NUMERIC;
  tier TEXT := 'None';
BEGIN
  -- Calculate team deposits
  team_deposits := public.calculate_team_deposits(p_user_id);
  
  -- Determine tier based on team deposits
  IF team_deposits >= 1000000 THEN tier := 'Mythic';
  ELSIF team_deposits >= 500000 THEN tier := 'Legend';
  ELSIF team_deposits >= 250000 THEN tier := 'Elite';
  ELSIF team_deposits >= 100000 THEN tier := 'Grandmaster';
  ELSIF team_deposits >= 50000 THEN tier := 'Master';
  ELSIF team_deposits >= 25000 THEN tier := 'Diamond';
  ELSIF team_deposits >= 10000 THEN tier := 'Platinum';
  ELSIF team_deposits >= 5000 THEN tier := 'Gold';
  ELSIF team_deposits >= 2000 THEN tier := 'Silver';
  ELSIF team_deposits >= 500 THEN tier := 'Bronze';
  END IF;
  
  RETURN tier;
END;
$$;

-- Create function to get salary amount for tier
CREATE OR REPLACE FUNCTION public.get_tier_salary_amount(p_tier TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE p_tier
    WHEN 'Bronze' THEN 50
    WHEN 'Silver' THEN 75
    WHEN 'Gold' THEN 100
    WHEN 'Platinum' THEN 120
    WHEN 'Diamond' THEN 130
    WHEN 'Master' THEN 150
    WHEN 'Grandmaster' THEN 200
    WHEN 'Elite' THEN 300
    WHEN 'Legend' THEN 400
    WHEN 'Mythic' THEN 500
    ELSE 0
  END;
END;
$$;