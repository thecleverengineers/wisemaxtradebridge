-- Create binary options trades table
CREATE TABLE public.binary_options_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_pair TEXT NOT NULL DEFAULT 'EUR/USD',
  trade_type TEXT NOT NULL CHECK (trade_type IN ('CALL', 'PUT')),
  stake_amount NUMERIC NOT NULL CHECK (stake_amount > 0),
  entry_price NUMERIC NOT NULL,
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  payout_rate NUMERIC NOT NULL DEFAULT 0.80,
  profit_loss NUMERIC DEFAULT 0,
  admin_forced_result TEXT CHECK (admin_forced_result IN ('WIN', 'LOSE') OR admin_forced_result IS NULL),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  settled_at TIMESTAMP WITH TIME ZONE
);

-- Create binary signals table
CREATE TABLE public.binary_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_pair TEXT NOT NULL DEFAULT 'EUR/USD',
  signal_type TEXT NOT NULL CHECK (signal_type IN ('CALL', 'PUT')),
  strength TEXT NOT NULL DEFAULT 'medium' CHECK (strength IN ('strong', 'medium', 'weak')),
  admin_forced BOOLEAN DEFAULT false,
  created_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create admin settings table
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.binary_options_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for binary_options_trades
CREATE POLICY "Users can view their own trades" 
ON public.binary_options_trades 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades" 
ON public.binary_options_trades 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades" 
ON public.binary_options_trades 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all trades" 
ON public.binary_options_trades 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for binary_signals
CREATE POLICY "Everyone can view active signals" 
ON public.binary_signals 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage signals" 
ON public.binary_signals 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_settings
CREATE POLICY "Admins can manage settings" 
ON public.admin_settings 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Function to place a binary trade
CREATE OR REPLACE FUNCTION public.place_binary_trade(
  p_user_id UUID,
  p_asset_pair TEXT,
  p_trade_type TEXT,
  p_stake_amount NUMERIC,
  p_expiry_minutes INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trade_id UUID;
  v_current_price NUMERIC;
  v_user_balance NUMERIC;
BEGIN
  -- Check user balance
  SELECT balance INTO v_user_balance
  FROM public.wallets
  WHERE user_id = p_user_id AND currency = 'USDT';
  
  IF v_user_balance < p_stake_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Generate random current price (simulate)
  v_current_price := 1.0800 + (RANDOM() * 0.02);
  
  -- Create trade
  INSERT INTO public.binary_options_trades (
    user_id,
    asset_pair,
    trade_type,
    stake_amount,
    entry_price,
    expiry_time
  ) VALUES (
    p_user_id,
    p_asset_pair,
    p_trade_type,
    p_stake_amount,
    v_current_price,
    now() + (p_expiry_minutes || ' minutes')::INTERVAL
  ) RETURNING id INTO v_trade_id;
  
  -- Deduct stake from wallet
  UPDATE public.wallets
  SET balance = balance - p_stake_amount
  WHERE user_id = p_user_id AND currency = 'USDT';
  
  -- Create transaction record
  INSERT INTO public.transactions (
    user_id,
    type,
    category,
    currency,
    amount,
    status,
    reference_id,
    notes
  ) VALUES (
    p_user_id,
    'binary_trade',
    'trading',
    'USDT',
    p_stake_amount,
    'completed',
    v_trade_id,
    'Binary options trade: ' || p_trade_type || ' on ' || p_asset_pair
  );
  
  RETURN v_trade_id;
END;
$$;

-- Function to settle binary trades
CREATE OR REPLACE FUNCTION public.settle_binary_trade(p_trade_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trade RECORD;
  v_exit_price NUMERIC;
  v_is_winner BOOLEAN;
  v_payout NUMERIC;
BEGIN
  -- Get trade details
  SELECT * INTO v_trade
  FROM public.binary_options_trades
  WHERE id = p_trade_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Generate exit price (simulate)
  v_exit_price := v_trade.entry_price + ((RANDOM() - 0.5) * 0.01);
  
  -- Check for admin forced result
  IF v_trade.admin_forced_result = 'WIN' THEN
    v_is_winner := true;
  ELSIF v_trade.admin_forced_result = 'LOSE' THEN
    v_is_winner := false;
  ELSE
    -- Determine winner based on trade type and price movement
    IF v_trade.trade_type = 'CALL' THEN
      v_is_winner := v_exit_price > v_trade.entry_price;
    ELSE -- PUT
      v_is_winner := v_exit_price < v_trade.entry_price;
    END IF;
  END IF;
  
  -- Calculate payout
  IF v_is_winner THEN
    v_payout := v_trade.stake_amount * (1 + v_trade.payout_rate);
    
    -- Credit wallet
    UPDATE public.wallets
    SET balance = balance + v_payout
    WHERE user_id = v_trade.user_id AND currency = 'USDT';
    
    -- Update trade
    UPDATE public.binary_options_trades
    SET 
      status = 'won',
      exit_price = v_exit_price,
      profit_loss = v_trade.stake_amount * v_trade.payout_rate,
      settled_at = now()
    WHERE id = p_trade_id;
    
    -- Create transaction
    INSERT INTO public.transactions (
      user_id,
      type,
      category,
      currency,
      amount,
      status,
      reference_id,
      notes
    ) VALUES (
      v_trade.user_id,
      'binary_payout',
      'reward',
      'USDT',
      v_payout,
      'completed',
      p_trade_id,
      'Binary trade WIN payout'
    );
  ELSE
    -- Update trade as lost
    UPDATE public.binary_options_trades
    SET 
      status = 'lost',
      exit_price = v_exit_price,
      profit_loss = -v_trade.stake_amount,
      settled_at = now()
    WHERE id = p_trade_id;
  END IF;
END;
$$;

-- Function to generate trading signals
CREATE OR REPLACE FUNCTION public.generate_trading_signal()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signal_id UUID;
  v_signal_type TEXT;
  v_strength TEXT;
  v_asset_pair TEXT;
BEGIN
  -- Randomly select signal parameters
  v_signal_type := CASE WHEN RANDOM() > 0.5 THEN 'CALL' ELSE 'PUT' END;
  v_strength := CASE 
    WHEN RANDOM() < 0.33 THEN 'weak'
    WHEN RANDOM() < 0.66 THEN 'medium'
    ELSE 'strong'
  END;
  v_asset_pair := (ARRAY['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'])[FLOOR(RANDOM() * 4 + 1)];
  
  -- Deactivate old signals for this pair
  UPDATE public.binary_signals
  SET is_active = false
  WHERE asset_pair = v_asset_pair AND is_active = true;
  
  -- Create new signal
  INSERT INTO public.binary_signals (
    asset_pair,
    signal_type,
    strength,
    expires_at
  ) VALUES (
    v_asset_pair,
    v_signal_type,
    v_strength,
    now() + INTERVAL '30 seconds'
  ) RETURNING id INTO v_signal_id;
  
  RETURN v_signal_id;
END;
$$;

-- Initial admin settings
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES 
  ('min_stake', '10'::jsonb),
  ('max_stake', '1000'::jsonb),
  ('payout_rate', '0.80'::jsonb),
  ('available_pairs', '["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"]'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;