-- Create ROI Plans table (admin-managed plans)
CREATE TABLE public.roi_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration_type TEXT NOT NULL CHECK (duration_type IN ('hourly', 'daily', 'monthly', 'quarterly', 'yearly', 'custom')),
  duration_value INTEGER NOT NULL, -- Number of units (e.g., 30 for 30 days)
  min_investment NUMERIC NOT NULL DEFAULT 0,
  max_investment NUMERIC,
  interest_rate NUMERIC NOT NULL, -- Percentage
  is_compounding BOOLEAN DEFAULT false,
  allow_early_withdrawal BOOLEAN DEFAULT true,
  withdrawal_penalty NUMERIC DEFAULT 0, -- Percentage penalty for early withdrawal
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create User ROI Investments table
CREATE TABLE public.user_roi_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.roi_plans(id),
  amount NUMERIC NOT NULL,
  custom_interest_rate NUMERIC, -- If user can set custom rate
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  maturity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_value NUMERIC NOT NULL,
  total_withdrawn NUMERIC DEFAULT 0,
  last_calculation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matured', 'withdrawn', 'reinvested')),
  auto_reinvest BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ROI Earnings History table
CREATE TABLE public.roi_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.user_roi_investments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  earning_type TEXT NOT NULL CHECK (earning_type IN ('interest', 'compound', 'bonus', 'penalty')),
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ROI Withdrawals table
CREATE TABLE public.roi_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.user_roi_investments(id),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  withdrawal_type TEXT CHECK (withdrawal_type IN ('partial', 'full', 'interest_only')),
  penalty_amount NUMERIC DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roi_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roi_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roi_plans (public read, admin write)
CREATE POLICY "ROI plans are viewable by everyone" 
ON public.roi_plans FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage ROI plans" 
ON public.roi_plans FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for user_roi_investments
CREATE POLICY "Users can view their own investments" 
ON public.user_roi_investments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments" 
ON public.user_roi_investments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" 
ON public.user_roi_investments FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for roi_earnings
CREATE POLICY "Users can view their own earnings" 
ON public.roi_earnings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create earnings" 
ON public.roi_earnings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for roi_withdrawals
CREATE POLICY "Users can view their own withdrawals" 
ON public.roi_withdrawals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" 
ON public.roi_withdrawals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to calculate ROI earnings
CREATE OR REPLACE FUNCTION public.calculate_roi_earnings()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger for automatic ROI calculation
CREATE TRIGGER update_roi_earnings
BEFORE UPDATE ON public.user_roi_investments
FOR EACH ROW
WHEN (OLD.last_calculation_date IS DISTINCT FROM NEW.last_calculation_date)
EXECUTE FUNCTION public.calculate_roi_earnings();

-- Insert sample ROI plans
INSERT INTO public.roi_plans (name, duration_type, duration_value, min_investment, max_investment, interest_rate, is_compounding, allow_early_withdrawal, withdrawal_penalty, description, features) VALUES
('Hourly Quick Returns', 'hourly', 24, 100, 10000, 0.5, false, true, 5, 'Fast micro-returns paid every hour', '["0.5% hourly returns", "24 hour duration", "Early withdrawal allowed"]'),
('Daily Growth Plan', 'daily', 30, 500, 50000, 2, false, true, 10, 'Daily returns for 30 days', '["2% daily returns", "30 day duration", "Consistent daily income"]'),
('Monthly Premium', 'monthly', 6, 1000, 100000, 15, true, false, 0, 'Premium monthly compounding plan', '["15% monthly", "6 month lock-in", "Compounding interest"]'),
('Quarterly Elite', 'quarterly', 4, 5000, 500000, 25, true, true, 15, 'Elite quarterly investment plan', '["25% quarterly returns", "1 year duration", "VIP support"]'),
('Annual Wealth Builder', 'yearly', 2, 10000, 1000000, 120, true, false, 0, 'Long-term wealth building', '["120% annual returns", "2 year commitment", "Maximum growth potential"]'),
('Custom Flex Plan', 'custom', 90, 100, null, 5, false, true, 5, 'Flexible duration with custom rates', '["Customizable duration", "Variable interest rates", "Full flexibility"]');

-- Function to update timestamps
CREATE TRIGGER update_roi_plans_updated_at
BEFORE UPDATE ON public.roi_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roi_investments_updated_at
BEFORE UPDATE ON public.user_roi_investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();