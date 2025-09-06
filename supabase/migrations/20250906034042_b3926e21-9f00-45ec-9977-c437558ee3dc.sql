-- Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  referral_code TEXT UNIQUE,
  parent_id UUID REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  kyc_status TEXT DEFAULT 'pending',
  total_investment NUMERIC DEFAULT 0,
  total_roi_earned NUMERIC DEFAULT 0,
  total_referral_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create wallets table if not exists
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for wallets table
CREATE POLICY "Users can view their own wallet" 
  ON public.wallets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
  ON public.wallets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" 
  ON public.wallets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.users (user_id, email, name, referral_code)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'name',
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))
  );
  
  -- Create wallet for user
  INSERT INTO public.wallets (user_id, total_balance)
  VALUES (new.id, 0);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();