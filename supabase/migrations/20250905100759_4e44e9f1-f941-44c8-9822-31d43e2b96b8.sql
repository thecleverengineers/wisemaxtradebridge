-- Create missing tables and columns

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_balance DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create roi_ledger table  
CREATE TABLE IF NOT EXISTS public.roi_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  credited_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for admin roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS total_investment DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_roi_earned DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_referral_earned DECIMAL(10, 2) DEFAULT 0;

-- Add missing columns to investments table
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS daily_roi_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_roi_expected DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS roi_credited_days INTEGER DEFAULT 0;

-- Add missing columns to investment_plans table
ALTER TABLE public.investment_plans 
ADD COLUMN IF NOT EXISTS daily_roi DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_return_percent DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wallets
CREATE POLICY "Users can view their own wallet" 
ON public.wallets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
ON public.wallets FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for roi_ledger
CREATE POLICY "Users can view their own ROI ledger" 
ON public.roi_ledger FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.investments 
  WHERE investments.id = roi_ledger.investment_id 
  AND investments.user_id = auth.uid()
));

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own role" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- Admin policies for new tables
CREATE POLICY "Admins can manage all wallets" 
ON public.wallets FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all ROI ledger" 
ON public.roi_ledger FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles FOR ALL 
USING (true);

-- Create triggers for new tables
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate referral codes for existing users
UPDATE public.users 
SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL;