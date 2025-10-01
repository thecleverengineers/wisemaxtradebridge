-- First, ensure the user_roles table has proper constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_user_role' 
    AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT unique_user_role UNIQUE (user_id, role);
  END IF;
END $$;

-- Populate existing auth users into the users table with generated referral codes
DO $$
DECLARE
  auth_user RECORD;
  unique_code TEXT;
BEGIN
  FOR auth_user IN SELECT * FROM auth.users WHERE id NOT IN (SELECT id FROM public.users)
  LOOP
    -- Generate unique referral code for each user
    unique_code := generate_unique_referral_code();
    
    -- Insert user with their generated referral code
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
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'name', split_part(auth_user.email, '@', 1)),
      auth_user.raw_user_meta_data->>'phone',
      unique_code,
      NULL, -- No parent for existing users
      true,
      'pending',
      0,
      0,
      0,
      auth_user.created_at,
      now()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth_user.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Create wallets
    INSERT INTO public.wallets (user_id, currency, balance, roi_income, referral_income, bonus_income, level_income, locked_balance)
    VALUES 
      (auth_user.id, 'USDT', 0, 0, 0, 0, 0, 0),
      (auth_user.id, 'BTC', 0, 0, 0, 0, 0, 0),
      (auth_user.id, 'ETH', 0, 0, 0, 0, 0, 0)
    ON CONFLICT (user_id, currency) DO NOTHING;
    
    -- Create profile
    INSERT INTO public.profiles (id, full_name, username, created_at, updated_at)
    VALUES (
      auth_user.id,
      COALESCE(auth_user.raw_user_meta_data->>'name', split_part(auth_user.email, '@', 1)),
      NULL,
      auth_user.created_at,
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;