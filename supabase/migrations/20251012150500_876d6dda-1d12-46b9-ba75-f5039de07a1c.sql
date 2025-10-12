-- Create admin_settings table
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view settings"
  ON public.admin_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Only admins can update settings"
  ON public.admin_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Insert default settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('app_name', 'Investment Platform'),
  ('support_email', 'support@example.com'),
  ('min_withdrawal', '10'),
  ('max_withdrawal', '50000');

-- Add missing columns to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDT';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create edge function for approving withdrawals
CREATE OR REPLACE FUNCTION public.approve_withdrawal(withdrawal_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user has admin role
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')) THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Update withdrawal request
  UPDATE public.withdrawal_requests
  SET 
    status = 'approved',
    processed_by = auth.uid(),
    processed_at = NOW()
  WHERE id = withdrawal_id;

  RETURN json_build_object('success', true, 'message', 'Withdrawal approved');
END;
$$;

-- Create edge function for rejecting withdrawals
CREATE OR REPLACE FUNCTION public.reject_withdrawal(withdrawal_id UUID, note TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user has admin role
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')) THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Update withdrawal request
  UPDATE public.withdrawal_requests
  SET 
    status = 'rejected',
    processed_by = auth.uid(),
    processed_at = NOW(),
    admin_note = note
  WHERE id = withdrawal_id;

  RETURN json_build_object('success', true, 'message', 'Withdrawal rejected');
END;
$$;

-- Create edge function for placing binary trades
CREATE OR REPLACE FUNCTION public.place_binary_trade(
  p_asset TEXT,
  p_direction TEXT,
  p_amount NUMERIC,
  p_entry_price NUMERIC,
  p_duration INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_wallet_balance NUMERIC;
  v_trade_id UUID;
  result JSON;
BEGIN
  v_user_id := auth.uid();
  
  -- Check wallet balance
  SELECT balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = v_user_id;
  
  IF v_wallet_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient balance');
  END IF;
  
  -- Deduct amount from wallet
  UPDATE public.wallets
  SET balance = balance - p_amount,
      locked_balance = locked_balance + p_amount
  WHERE user_id = v_user_id;
  
  -- Create binary trade record
  INSERT INTO public.binary_records (
    user_id,
    asset,
    direction,
    amount,
    entry_price,
    duration,
    expiry_time,
    status
  ) VALUES (
    v_user_id,
    p_asset,
    p_direction,
    p_amount,
    p_entry_price,
    p_duration,
    NOW() + (p_duration || ' minutes')::INTERVAL,
    'pending'
  ) RETURNING id INTO v_trade_id;
  
  RETURN json_build_object('success', true, 'trade_id', v_trade_id, 'message', 'Trade placed successfully');
END;
$$;

-- Add updated_at trigger to admin_settings
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();