-- Enable super-admin and superadmin roles to manage investment plans
CREATE POLICY "Superadmins can manage investment plans"
ON public.investment_plans
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role)
);

-- Allow superadmins to view all investments (for monitoring)
CREATE POLICY "Superadmins can view all investments"
ON public.investments
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'super-admin'::app_role)
);

-- Create function to process matured investments
CREATE OR REPLACE FUNCTION public.process_matured_investments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_investment RECORD;
  v_total_return NUMERIC;
BEGIN
  -- Find all active investments that have reached maturity
  FOR v_investment IN 
    SELECT i.*, ip.total_return_percent
    FROM public.investments i
    JOIN public.investment_plans ip ON i.plan_id = ip.id
    WHERE i.status = 'active'
    AND i.end_date <= NOW()
  LOOP
    -- Calculate total return (investment amount + ROI profit)
    v_total_return := v_investment.amount + (v_investment.amount * v_investment.total_return_percent / 100);
    
    -- Update user's wallet: release locked balance and add profit
    UPDATE public.wallets
    SET 
      balance = balance + v_total_return,
      locked_balance = locked_balance - v_investment.amount,
      roi_income = roi_income + (v_investment.amount * v_investment.total_return_percent / 100)
    WHERE user_id = v_investment.user_id;
    
    -- Mark investment as completed
    UPDATE public.investments
    SET 
      status = 'completed',
      updated_at = NOW()
    WHERE id = v_investment.id;
    
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
      v_investment.user_id,
      'credit',
      'roi',
      v_total_return,
      (SELECT balance FROM public.wallets WHERE user_id = v_investment.user_id),
      'Investment maturity: principal + ROI profit',
      'investment_maturity'
    );
  END LOOP;
END;
$$;