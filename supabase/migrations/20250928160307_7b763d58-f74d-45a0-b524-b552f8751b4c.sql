-- Add description column to investment_plans
ALTER TABLE public.investment_plans 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing investment plans with descriptions
UPDATE public.investment_plans SET description = 
  CASE 
    WHEN name = 'Basic Plan' THEN 'Perfect for beginners. Start your investment journey with minimal risk.'
    WHEN name = 'Standard Plan' THEN 'Balanced returns for steady growth. Ideal for regular investors.'
    WHEN name = 'Premium Plan' THEN 'High returns for serious investors. Maximum growth potential.'
    WHEN name = 'VIP Plan' THEN 'Exclusive access to highest returns. For elite investors only.'
    ELSE 'Investment plan with competitive returns'
  END
WHERE description IS NULL;

-- Create referral_bonus table for tracking bonuses
CREATE TABLE IF NOT EXISTS public.referral_bonus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.users(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  bonus_type TEXT NOT NULL DEFAULT 'referral',
  base_amount NUMERIC,
  percentage NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for referral_bonus
ALTER TABLE public.referral_bonus ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for referral_bonus
CREATE POLICY "Users can view their own bonuses" 
ON public.referral_bonus FOR SELECT 
USING (auth.uid() = user_id);

-- Add missing columns to wallets for income tracking
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS roi_income NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_income NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_income NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_income NUMERIC DEFAULT 0;