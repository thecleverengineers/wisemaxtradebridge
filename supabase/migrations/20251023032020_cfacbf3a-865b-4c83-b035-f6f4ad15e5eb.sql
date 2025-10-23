-- Create or replace function to distribute referral commissions on investment
CREATE OR REPLACE FUNCTION public.distribute_referral_commissions(
  p_investor_id UUID,
  p_investment_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_referrer_id UUID;
  v_level INTEGER;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_referrer_record RECORD;
BEGIN
  -- Define 20-level commission rates
  DECLARE
    commission_rates NUMERIC[] := ARRAY[
      5.0,   -- Level 1: 5%
      2.5,   -- Level 2: 2.5%
      1.5,   -- Level 3: 1.5%
      1.0,   -- Level 4: 1.0%
      0.8,   -- Level 5: 0.8%
      0.6,   -- Level 6: 0.6%
      0.5,   -- Level 7: 0.5%
      0.4,   -- Level 8: 0.4%
      0.3,   -- Level 9: 0.3%
      0.25,  -- Level 10: 0.25%
      0.2,   -- Level 11: 0.2%
      0.15,  -- Level 12: 0.15%
      0.12,  -- Level 13: 0.12%
      0.1,   -- Level 14: 0.1%
      0.08,  -- Level 15: 0.08%
      0.06,  -- Level 16: 0.06%
      0.05,  -- Level 17: 0.05%
      0.04,  -- Level 18: 0.04%
      0.03,  -- Level 19: 0.03%
      0.02   -- Level 20: 0.02%
    ];
  BEGIN
    -- Loop through all referral levels (up to 20)
    FOR v_level IN 1..20 LOOP
      -- Get the referrer at this level
      SELECT user_id INTO v_referrer_id
      FROM public.referrals
      WHERE referred_user_id = p_investor_id
        AND level = v_level
      LIMIT 1;
      
      -- Exit if no referrer at this level
      EXIT WHEN v_referrer_id IS NULL;
      
      -- Get commission rate for this level
      v_commission_rate := commission_rates[v_level];
      v_commission_amount := (p_investment_amount * v_commission_rate) / 100;
      
      -- Credit commission to referrer's wallet
      UPDATE public.wallets
      SET 
        balance = balance + v_commission_amount,
        referral_income = referral_income + v_commission_amount,
        level_income = level_income + v_commission_amount
      WHERE user_id = v_referrer_id;
      
      -- Record the referral bonus
      INSERT INTO public.referral_bonuses (
        user_id,
        from_user_id,
        amount,
        level,
        bonus_type,
        base_amount,
        percentage,
        status
      ) VALUES (
        v_referrer_id,
        p_investor_id,
        v_commission_amount,
        v_level,
        'investment_commission',
        p_investment_amount,
        v_commission_rate,
        'credited'
      );
      
      -- Create transaction record
      INSERT INTO public.transactions (
        user_id,
        type,
        income_type,
        amount,
        balance_after,
        reason,
        category
      ) VALUES (
        v_referrer_id,
        'credit',
        'referral',
        v_commission_amount,
        (SELECT balance FROM public.wallets WHERE user_id = v_referrer_id),
        'Level ' || v_level || ' referral commission from investment',
        'referral_commission'
      );
    END LOOP;
  END;
END;
$$;

-- Create trigger function for investment creation
CREATE OR REPLACE FUNCTION public.trigger_distribute_referral_commissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only distribute commissions for new active investments
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'active')) THEN
    PERFORM public.distribute_referral_commissions(NEW.user_id, NEW.amount);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS distribute_commissions_on_investment ON public.investments;

-- Create trigger on investments table
CREATE TRIGGER distribute_commissions_on_investment
  AFTER INSERT OR UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_distribute_referral_commissions();