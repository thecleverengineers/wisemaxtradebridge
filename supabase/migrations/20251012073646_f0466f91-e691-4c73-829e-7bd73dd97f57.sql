-- Fix search path security warning for calculate_team_deposits function
DROP FUNCTION IF EXISTS public.calculate_team_deposits(UUID);

CREATE OR REPLACE FUNCTION public.calculate_team_deposits(referrer_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_deposits NUMERIC;
BEGIN
  -- Calculate total deposits from direct referrals
  SELECT COALESCE(SUM(w.total_deposited), 0)
  INTO total_deposits
  FROM public.wallets w
  INNER JOIN public.users u ON u.id = w.user_id
  WHERE u.referred_by = referrer_user_id;
  
  RETURN total_deposits;
END;
$$;