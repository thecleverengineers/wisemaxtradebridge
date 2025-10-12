-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'superadmin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  phone TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  currency TEXT DEFAULT 'USDT',
  balance NUMERIC DEFAULT 0,
  locked_balance NUMERIC DEFAULT 0,
  total_deposited NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  roi_income NUMERIC DEFAULT 0,
  referral_income NUMERIC DEFAULT 0,
  bonus_income NUMERIC DEFAULT 0,
  level_income NUMERIC DEFAULT 0,
  wallet_address TEXT,
  network TEXT,
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- Create investment_plans table
CREATE TABLE public.investment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  min_amount NUMERIC NOT NULL,
  max_amount NUMERIC NOT NULL,
  daily_roi NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL,
  total_return_percent NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active investment plans"
  ON public.investment_plans FOR SELECT
  USING (status = 'active');

-- Create investments table
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.investment_plans(id) NOT NULL,
  amount NUMERIC NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active',
  total_roi_earned NUMERIC DEFAULT 0,
  daily_roi_amount NUMERIC,
  total_roi_expected NUMERIC,
  roi_credited_days INTEGER DEFAULT 0,
  last_payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own investments"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments"
  ON public.investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create roi_investments table
CREATE TABLE public.roi_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  roi_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  credited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.roi_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ROI records"
  ON public.roi_investments FOR SELECT
  USING (auth.uid() = user_id);

-- Create referrals table with 20-level support
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = user_id);

-- Create referral_bonuses table
CREATE TABLE public.referral_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 20),
  bonus_type TEXT NOT NULL,
  base_amount NUMERIC,
  percentage NUMERIC,
  status TEXT DEFAULT 'credited',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.referral_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bonuses"
  ON public.referral_bonuses FOR SELECT
  USING (auth.uid() = user_id);

-- Create staking_plans table
CREATE TABLE public.staking_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  min_amount NUMERIC NOT NULL,
  max_amount NUMERIC NOT NULL,
  daily_return NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL,
  total_return_percent NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.staking_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active staking plans"
  ON public.staking_plans FOR SELECT
  USING (status = 'active');

-- Create staking_records table
CREATE TABLE public.staking_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.staking_plans(id) NOT NULL,
  amount NUMERIC NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active',
  total_earned NUMERIC DEFAULT 0,
  daily_return_amount NUMERIC,
  total_expected NUMERIC,
  days_credited INTEGER DEFAULT 0,
  last_payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.staking_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own staking"
  ON public.staking_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own staking"
  ON public.staking_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  income_type TEXT,
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Create binary_records table
CREATE TABLE public.binary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  asset TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  duration INTEGER NOT NULL,
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  profit_loss NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settled_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.binary_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own binary trades"
  ON public.binary_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own binary trades"
  ON public.binary_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create bot_strategies table
CREATE TABLE public.bot_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  allocated_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  total_profit NUMERIC DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.bot_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bot strategies"
  ON public.bot_strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bot strategies"
  ON public.bot_strategies FOR ALL
  USING (auth.uid() = user_id);

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can update withdrawal requests"
  ON public.withdrawal_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Create trigger to auto-generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    public.generate_referral_code()
  );
  
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to build referral tree (20 levels)
CREATE OR REPLACE FUNCTION public.build_referral_tree(referrer_id UUID, new_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_referrer UUID;
  current_level INTEGER := 1;
BEGIN
  current_referrer := referrer_id;
  
  WHILE current_referrer IS NOT NULL AND current_level <= 20 LOOP
    INSERT INTO public.referrals (user_id, referred_user_id, level)
    VALUES (current_referrer, new_user_id, current_level);
    
    SELECT referred_by INTO current_referrer
    FROM public.profiles
    WHERE id = current_referrer;
    
    current_level := current_level + 1;
  END LOOP;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_staking_records_updated_at
  BEFORE UPDATE ON public.staking_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bot_strategies_updated_at
  BEFORE UPDATE ON public.bot_strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();