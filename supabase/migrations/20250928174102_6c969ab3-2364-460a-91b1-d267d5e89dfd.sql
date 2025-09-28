-- Update the handle_new_user_registration function to generate 8-digit numeric referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    referral_code,
    parent_id
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    -- Generate 8-digit numeric referral code
    LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0'),
    (
      SELECT id FROM public.users 
      WHERE referral_code = NEW.raw_user_meta_data->>'referral_code'
      LIMIT 1
    )
  );
  
  -- Create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create initial wallets if they don't exist
  INSERT INTO public.wallets (user_id, currency, balance)
  VALUES 
    (NEW.id, 'USDT', 10000),
    (NEW.id, 'BTC', 0),
    (NEW.id, 'ETH', 0)
  ON CONFLICT (user_id, currency) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Update existing users table default for new direct inserts
ALTER TABLE public.users 
ALTER COLUMN referral_code 
SET DEFAULT LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');