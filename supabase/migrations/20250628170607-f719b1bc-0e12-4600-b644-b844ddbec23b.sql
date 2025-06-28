
-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_bonus ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for user_roles
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- Create RLS policies for wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for investments
CREATE POLICY "Users can view their own investments" ON public.investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies for investments
CREATE POLICY "Admins can manage all investments" ON public.investments
  FOR ALL USING (public.is_admin());

-- Create RLS policies for wallet_transactions
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for withdrawals
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies for withdrawals
CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawals
  FOR ALL USING (public.is_admin());

-- Create RLS policies for roi_ledger
CREATE POLICY "Users can view their own ROI ledger" ON public.roi_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for referral_bonus
CREATE POLICY "Users can view their own referral bonus" ON public.referral_bonus
  FOR SELECT USING (auth.uid() = user_id);

-- Investment plans should be viewable by all authenticated users
CREATE POLICY "Authenticated users can view investment plans" ON public.investment_plans
  FOR SELECT TO authenticated USING (is_active = true);

-- Admins can manage investment plans
CREATE POLICY "Admins can manage investment plans" ON public.investment_plans
  FOR ALL USING (public.is_admin());

-- Settings policies
CREATE POLICY "Authenticated users can view public settings" ON public.settings
  FOR SELECT TO authenticated USING (is_public = true);

CREATE POLICY "Admins can manage all settings" ON public.settings
  FOR ALL USING (public.is_admin());

-- System logs - only admins can view
CREATE POLICY "Admins can view system logs" ON public.system_logs
  FOR SELECT USING (public.is_admin());

-- Update the handle_new_user function to work with the existing schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    referral_code_val TEXT;
    parent_user_id UUID := NULL;
BEGIN
    -- Generate unique referral code
    referral_code_val := 'REF' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    
    -- Check if user was referred by someone
    IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
        SELECT id INTO parent_user_id 
        FROM public.users 
        WHERE referral_code = NEW.raw_user_meta_data->>'referral_code'
        LIMIT 1;
    END IF;
    
    -- Insert user profile
    INSERT INTO public.users (id, name, referral_code, parent_id, phone)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), 
        referral_code_val,
        parent_user_id,
        NEW.raw_user_meta_data->>'phone'
    );
    
    -- Create wallet for user
    INSERT INTO public.wallets (user_id) VALUES (NEW.id);
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$function$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
