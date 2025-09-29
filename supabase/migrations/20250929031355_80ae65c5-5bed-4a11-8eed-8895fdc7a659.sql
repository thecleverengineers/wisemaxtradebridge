-- Update the referral commission processing function to support 10 levels
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
  -- 10 levels of commission rates
  commission_rates numeric[] := ARRAY[10, 5, 3, 2, 1.5, 1, 0.75, 0.5, 0.25, 0.1];
BEGIN
  -- Only process for new investments or status changes to active
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active') THEN
    
    current_user_id := NEW.user_id;
    
    -- Process up to 10 levels of referrals
    WHILE level_count <= 10 LOOP
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
        balance = balance + commission_amount,
        level_income = CASE 
          WHEN level_count > 1 THEN level_income + commission_amount 
          ELSE level_income 
        END
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