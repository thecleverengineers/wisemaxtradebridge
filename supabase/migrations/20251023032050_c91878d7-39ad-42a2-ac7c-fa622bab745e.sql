-- Update handle_new_user function to properly link referrals
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_code TEXT;
BEGIN
  -- Extract referral code from user metadata
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';
  
  -- Create profile
  INSERT INTO public.profiles (id, email, name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    public.generate_referral_code()
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- If referral code provided, link to referrer
  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    -- Find referrer by referral code
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_referral_code
    LIMIT 1;
    
    -- If referrer found, update profile and build referral tree
    IF v_referrer_id IS NOT NULL THEN
      UPDATE public.profiles
      SET referred_by = v_referrer_id
      WHERE id = NEW.id;
      
      -- Build 20-level referral tree
      PERFORM public.build_referral_tree(v_referrer_id, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;