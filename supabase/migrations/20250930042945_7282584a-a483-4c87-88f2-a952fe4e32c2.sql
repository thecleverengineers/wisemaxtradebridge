-- Fix security issue: Add search_path to the calculate_roi_earnings function
CREATE OR REPLACE FUNCTION public.calculate_roi_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_record RECORD;
  time_elapsed NUMERIC;
  interest_earned NUMERIC;
BEGIN
  -- Get plan details
  SELECT * INTO plan_record FROM public.roi_plans WHERE id = NEW.plan_id;
  
  -- Calculate time elapsed based on duration type
  CASE plan_record.duration_type
    WHEN 'hourly' THEN
      time_elapsed := EXTRACT(EPOCH FROM (now() - NEW.last_calculation_date)) / 3600;
    WHEN 'daily' THEN
      time_elapsed := EXTRACT(EPOCH FROM (now() - NEW.last_calculation_date)) / 86400;
    WHEN 'monthly' THEN
      time_elapsed := EXTRACT(EPOCH FROM (now() - NEW.last_calculation_date)) / 2592000;
    WHEN 'quarterly' THEN
      time_elapsed := EXTRACT(EPOCH FROM (now() - NEW.last_calculation_date)) / 7776000;
    WHEN 'yearly' THEN
      time_elapsed := EXTRACT(EPOCH FROM (now() - NEW.last_calculation_date)) / 31536000;
    ELSE
      time_elapsed := EXTRACT(EPOCH FROM (now() - NEW.last_calculation_date)) / 86400;
  END CASE;
  
  -- Calculate interest
  IF plan_record.is_compounding THEN
    interest_earned := NEW.current_value * (POWER(1 + (COALESCE(NEW.custom_interest_rate, plan_record.interest_rate) / 100), time_elapsed) - 1);
  ELSE
    interest_earned := NEW.amount * (COALESCE(NEW.custom_interest_rate, plan_record.interest_rate) / 100) * time_elapsed;
  END IF;
  
  -- Update current value
  NEW.current_value := NEW.current_value + interest_earned;
  NEW.last_calculation_date := now();
  
  -- Record earnings
  IF interest_earned > 0 THEN
    INSERT INTO public.roi_earnings (investment_id, user_id, amount, earning_type)
    VALUES (NEW.id, NEW.user_id, interest_earned, CASE WHEN plan_record.is_compounding THEN 'compound' ELSE 'interest' END);
  END IF;
  
  -- Check if matured
  IF now() >= NEW.maturity_date AND NEW.status = 'active' THEN
    NEW.status := 'matured';
    
    -- Handle auto-reinvest
    IF NEW.auto_reinvest THEN
      INSERT INTO public.user_roi_investments (
        user_id, plan_id, amount, custom_interest_rate, 
        maturity_date, current_value, auto_reinvest
      )
      VALUES (
        NEW.user_id, NEW.plan_id, NEW.current_value, NEW.custom_interest_rate,
        now() + (plan_record.duration_value || ' ' || 
          CASE plan_record.duration_type
            WHEN 'hourly' THEN 'hours'
            WHEN 'daily' THEN 'days'
            WHEN 'monthly' THEN 'months'
            WHEN 'quarterly' THEN 'months' -- Will multiply by 3
            WHEN 'yearly' THEN 'years'
            ELSE 'days'
          END)::INTERVAL * (CASE WHEN plan_record.duration_type = 'quarterly' THEN 3 ELSE 1 END),
        NEW.current_value,
        NEW.auto_reinvest
      );
      NEW.status := 'reinvested';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;