-- Fix search path security warning properly
DROP FUNCTION IF EXISTS public.calculate_team_deposits(UUID);

CREATE OR REPLACE FUNCTION public.calculate_team_deposits(referrer_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_deposits NUMERIC;
BEGIN
  -- Calculate total deposits from direct referrals
  SELECT COALESCE(SUM(w.total_deposited), 0)
  INTO total_deposits
  FROM wallets w
  INNER JOIN users u ON u.id = w.user_id
  WHERE u.referred_by = referrer_user_id;
  
  RETURN total_deposits;
END;
$$;