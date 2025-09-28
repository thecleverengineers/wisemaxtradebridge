-- Drop existing triggers to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_initial_wallets_trigger ON public.users;

-- Create a single, comprehensive function for handling new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  parent_user_id uuid;
BEGIN
  -- Find parent user if referral code is provided
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL AND NEW.raw_user_meta_data->>'referral_code' != '' THEN
    SELECT id INTO parent_user_id 
    FROM public.users 
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code'
    LIMIT 1;
  END IF;

  -- Insert user record
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
    -- Generate 8-digit numeric referral code
    LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0'),
    parent_user_id,
    true,
    'pending',
    0,
    0,
    0,
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Create default user role (only if user was created)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create initial wallets (only if they don't exist)
  INSERT INTO public.wallets (user_id, currency, balance, roi_income, referral_income, bonus_income, level_income, locked_balance)
  VALUES 
    (NEW.id, 'USDT', 0, 0, 0, 0, 0, 0),
    (NEW.id, 'BTC', 0, 0, 0, 0, 0, 0),
    (NEW.id, 'ETH', 0, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id, currency) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error in handle_new_user_registration: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create a single trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();

-- Ensure profiles table also gets updated (if it exists)
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

-- Create trigger for profiles
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();

-- Clean up any duplicate or orphaned functions
DROP FUNCTION IF EXISTS public.create_initial_wallets() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;