-- First, ensure we have the proper referral tracking structure
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create a function to calculate and distribute referral commissions
CREATE OR REPLACE FUNCTION public.process_referral_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  referrer_record RECORD;
  commission_amount numeric;
  level_count integer := 1;
  current_user_id uuid;
  commission_rates numeric[] := ARRAY[10, 5, 2]; -- Level 1: 10%, Level 2: 5%, Level 3: 2%
BEGIN
  -- Only process for new investments or status changes to active
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active') THEN
    
    current_user_id := NEW.user_id;
    
    -- Process up to 3 levels of referrals
    WHILE level_count <= 3 LOOP
      -- Find the referrer for the current user
      SELECT u.id, u.parent_id, u.name, u.email
      INTO referrer_record
      FROM public.users u
      WHERE u.id = (
        SELECT parent_id FROM public.users WHERE id = current_user_id
      );
      
      -- Exit if no referrer found
      EXIT WHEN referrer_record.id IS NULL;
      
      -- Calculate commission based on level
      commission_amount := NEW.amount * (commission_rates[level_count] / 100);
      
      -- Create or update referral record
      INSERT INTO public.referrals (
        referrer_id,
        referred_id,
        level,
        total_deposits,
        commission_earned,
        status,
        last_activity_at
      )
      VALUES (
        referrer_record.id,
        NEW.user_id,
        level_count,
        NEW.amount,
        commission_amount,
        'active',
        now()
      )
      ON CONFLICT (referrer_id, referred_id) 
      DO UPDATE SET
        total_deposits = referrals.total_deposits + NEW.amount,
        commission_earned = referrals.commission_earned + commission_amount,
        last_activity_at = now();
      
      -- Create referral bonus record
      INSERT INTO public.referral_bonus (
        user_id,
        referral_id,
        amount,
        percentage,
        base_amount,
        level,
        bonus_type,
        status,
        created_at
      )
      VALUES (
        referrer_record.id,
        NEW.user_id,
        commission_amount,
        commission_rates[level_count],
        NEW.amount,
        level_count,
        'investment',
        'completed',
        now()
      );
      
      -- Update referrer's wallet with referral income
      UPDATE public.wallets
      SET 
        referral_income = referral_income + commission_amount,
        balance = balance + commission_amount
      WHERE user_id = referrer_record.id AND currency = 'USDT';
      
      -- Update user's total referral earned
      UPDATE public.users
      SET total_referral_earned = total_referral_earned + commission_amount
      WHERE id = referrer_record.id;
      
      -- Create transaction record for the commission
      INSERT INTO public.transactions (
        user_id,
        type,
        category,
        currency,
        amount,
        status,
        reference_id,
        notes,
        created_at
      )
      VALUES (
        referrer_record.id,
        'referral',
        'reward',
        'USDT',
        commission_amount,
        'completed',
        NEW.id,
        'Level ' || level_count || ' referral commission from investment',
        now()
      );
      
      -- Move to the next level
      current_user_id := referrer_record.id;
      level_count := level_count + 1;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for ROI investments
DROP TRIGGER IF EXISTS process_roi_investment_referral ON public.roi_investments;
CREATE TRIGGER process_roi_investment_referral
AFTER INSERT OR UPDATE ON public.roi_investments
FOR EACH ROW
EXECUTE FUNCTION public.process_referral_commission();

-- Create trigger for regular investments
DROP TRIGGER IF EXISTS process_investment_referral ON public.investments;
CREATE TRIGGER process_investment_referral
AFTER INSERT OR UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.process_referral_commission();

-- Add unique constraint to prevent duplicate referral relationships
ALTER TABLE public.referrals
DROP CONSTRAINT IF EXISTS unique_referral_relationship;

ALTER TABLE public.referrals
ADD CONSTRAINT unique_referral_relationship UNIQUE (referrer_id, referred_id);

-- Create an index for faster referral lookups
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON public.users(parent_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_bonus_user_id ON public.referral_bonus(user_id);

-- Update the referral code generation in the user registration to ensure uniqueness
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 8-digit numeric code
    new_code := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$function$;

-- Update the user registration function to use unique referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  parent_user_id uuid;
  unique_referral_code text;
BEGIN
  -- Generate unique referral code
  unique_referral_code := generate_unique_referral_code();
  
  -- Find parent user if referral code is provided
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL AND NEW.raw_user_meta_data->>'referral_code' != '' THEN
    SELECT id INTO parent_user_id 
    FROM public.users 
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code'
    LIMIT 1;
    
    -- If parent user found, create initial referral record
    IF parent_user_id IS NOT NULL THEN
      INSERT INTO public.referrals (
        referrer_id,
        referred_id,
        level,
        status,
        created_at
      )
      VALUES (
        parent_user_id,
        NEW.id,
        1,
        'active',
        now()
      )
      ON CONFLICT (referrer_id, referred_id) DO NOTHING;
    END IF;
  END IF;

  -- Insert user record with unique referral code
  INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    referral_code,
    parent_id,
    is_active,
    kyc_status,
    total_investment,
    total_roi_earned,
    total_referral_earned,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    unique_referral_code,
    parent_user_id,
    true,
    'pending',
    0,
    0,
    0,
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create initial wallets
  INSERT INTO public.wallets (user_id, currency, balance, roi_income, referral_income, bonus_income, level_income, locked_balance)
  VALUES 
    (NEW.id, 'USDT', 0, 0, 0, 0, 0, 0),
    (NEW.id, 'BTC', 0, 0, 0, 0, 0, 0),
    (NEW.id, 'ETH', 0, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id, currency) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user_registration: %', SQLERRM;
    RETURN NEW;
END;
$function$;