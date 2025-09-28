-- Create investment plans table
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_amount NUMERIC NOT NULL,
  max_amount NUMERIC NOT NULL,
  daily_roi NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL,
  total_return_percent NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create investments table
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.investment_plans(id),
  amount NUMERIC NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  total_roi_earned NUMERIC DEFAULT 0,
  last_payout_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ROI ledger table
CREATE TABLE IF NOT EXISTS public.roi_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments(id),
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily_roi', 'withdrawal', 'bonus')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investment_plans (public read)
CREATE POLICY "Investment plans are public" 
ON public.investment_plans FOR SELECT 
USING (true);

-- RLS Policies for investments
CREATE POLICY "Users can view their own investments" 
ON public.investments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments" 
ON public.investments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for roi_ledger
CREATE POLICY "Users can view their own ROI ledger" 
ON public.roi_ledger FOR SELECT 
USING (auth.uid() = user_id);

-- Insert default investment plans
INSERT INTO public.investment_plans (name, min_amount, max_amount, daily_roi, duration_days, total_return_percent) VALUES
  ('Basic Plan', 100, 1000, 2, 30, 60),
  ('Standard Plan', 1000, 5000, 2.5, 60, 150),
  ('Premium Plan', 5000, 20000, 3, 90, 270),
  ('VIP Plan', 20000, 100000, 3.5, 120, 420)
ON CONFLICT DO NOTHING;

-- Add wallet constraint to prevent duplicate currencies per user
ALTER TABLE public.wallets ADD CONSTRAINT unique_user_currency UNIQUE (user_id, currency);