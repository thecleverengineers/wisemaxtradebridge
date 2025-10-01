-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Ensure the handle_new_user_registration function is properly created
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

-- Create the trigger to execute the function after user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();

-- Also ensure profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, created_at, updated_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULL,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error in handle_new_profile: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create trigger for profile
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();