-- Create assets table for 15 different trading pairs
CREATE TABLE IF NOT EXISTS public.binary_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'crypto', 'forex', 'commodity'
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  min_trade_amount NUMERIC DEFAULT 1,
  max_trade_amount NUMERIC DEFAULT 10000,
  payout_rate NUMERIC DEFAULT 0.85, -- 85% default payout
  current_price NUMERIC NOT NULL DEFAULT 1.0000,
  previous_close NUMERIC,
  day_high NUMERIC,
  day_low NUMERIC,
  volatility NUMERIC DEFAULT 0.01, -- for price simulation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert 15 default assets
INSERT INTO public.binary_assets (symbol, name, category, base_currency, quote_currency, current_price, payout_rate) VALUES
  -- Forex pairs (6)
  ('EUR/USD', 'Euro / US Dollar', 'forex', 'EUR', 'USD', 1.0890, 0.85),
  ('GBP/USD', 'British Pound / US Dollar', 'forex', 'GBP', 'USD', 1.2750, 0.85),
  ('USD/JPY', 'US Dollar / Japanese Yen', 'forex', 'USD', 'JPY', 149.50, 0.85),
  ('AUD/USD', 'Australian Dollar / US Dollar', 'forex', 'AUD', 'USD', 0.6520, 0.85),
  ('USD/CAD', 'US Dollar / Canadian Dollar', 'forex', 'USD', 'CAD', 1.3680, 0.85),
  ('EUR/GBP', 'Euro / British Pound', 'forex', 'EUR', 'GBP', 0.8540, 0.85),
  
  -- Crypto pairs (6)
  ('BTC/USD', 'Bitcoin / US Dollar', 'crypto', 'BTC', 'USD', 95850.50, 0.90),
  ('ETH/USD', 'Ethereum / US Dollar', 'crypto', 'ETH', 'USD', 3420.25, 0.90),
  ('XRP/USD', 'Ripple / US Dollar', 'crypto', 'XRP', 'USD', 2.15, 0.88),
  ('SOL/USD', 'Solana / US Dollar', 'crypto', 'SOL', 'USD', 185.40, 0.88),
  ('BNB/USD', 'Binance Coin / US Dollar', 'crypto', 'BNB', 'USD', 695.80, 0.88),
  ('DOGE/USD', 'Dogecoin / US Dollar', 'crypto', 'DOGE', 'USD', 0.3250, 0.85),
  
  -- Commodities (3)
  ('GOLD/USD', 'Gold / US Dollar', 'commodity', 'GOLD', 'USD', 2650.50, 0.82),
  ('SILVER/USD', 'Silver / US Dollar', 'commodity', 'SILVER', 'USD', 31.25, 0.82),
  ('OIL/USD', 'Crude Oil / US Dollar', 'commodity', 'OIL', 'USD', 72.85, 0.80);

-- Create timeframes table
CREATE TABLE IF NOT EXISTS public.binary_timeframes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  duration_seconds INTEGER NOT NULL,
  payout_multiplier NUMERIC DEFAULT 1.0, -- can adjust payouts per timeframe
  is_active BOOLEAN DEFAULT true,
  min_stake NUMERIC DEFAULT 1,
  max_stake NUMERIC DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default timeframes
INSERT INTO public.binary_timeframes (name, duration_seconds, payout_multiplier) VALUES
  ('30s', 30, 0.95),
  ('1m', 60, 1.0),
  ('5m', 300, 1.05),
  ('15m', 900, 1.10);

-- Create market settings table
CREATE TABLE IF NOT EXISTS public.binary_market_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_mode TEXT DEFAULT 'random', -- 'random', 'signal', 'admin', 'algorithm'
  global_payout_multiplier NUMERIC DEFAULT 1.0,
  max_daily_trades_per_user INTEGER DEFAULT 100,
  max_daily_loss_per_user NUMERIC DEFAULT 1000,
  max_trade_size NUMERIC DEFAULT 5000,
  min_trade_size NUMERIC DEFAULT 1,
  demo_starting_balance NUMERIC DEFAULT 10000,
  is_trading_enabled BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID
);

-- Insert default market settings
INSERT INTO public.binary_market_settings (market_mode) VALUES ('random');

-- Enhanced binary_options_trades table (add new columns)
ALTER TABLE public.binary_options_trades 
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.binary_assets(id),
  ADD COLUMN IF NOT EXISTS timeframe_id UUID REFERENCES public.binary_timeframes(id),
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS outcome_type TEXT, -- 'random', 'signal', 'admin', 'algorithm'
  ADD COLUMN IF NOT EXISTS signal_strength TEXT,
  ADD COLUMN IF NOT EXISTS market_indicators JSONB;

-- Create price history table for charts
CREATE TABLE IF NOT EXISTS public.binary_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.binary_assets(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_price_history_asset_timestamp 
  ON public.binary_price_history(asset_id, timestamp DESC);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS public.binary_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
  period_start DATE NOT NULL,
  period_end DATE,
  total_trades INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  total_volume NUMERIC DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, period, period_start)
);

-- Add demo wallet support to wallets table
ALTER TABLE public.wallets 
  ADD COLUMN IF NOT EXISTS demo_balance NUMERIC DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS is_demo_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_reset_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_demo_reset TIMESTAMP WITH TIME ZONE;

-- Create risk management settings per user
CREATE TABLE IF NOT EXISTS public.binary_risk_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  max_daily_trades INTEGER DEFAULT 100,
  max_daily_loss NUMERIC DEFAULT 1000,
  max_trade_size NUMERIC DEFAULT 5000,
  max_open_trades INTEGER DEFAULT 10,
  cool_down_period_minutes INTEGER DEFAULT 0,
  is_self_excluded BOOLEAN DEFAULT false,
  self_exclusion_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trading signals table for analysis
CREATE TABLE IF NOT EXISTS public.binary_trading_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.binary_assets(id),
  signal_type TEXT NOT NULL, -- 'CALL' or 'PUT'
  strength TEXT NOT NULL, -- 'weak', 'medium', 'strong'
  indicator TEXT, -- 'MA', 'RSI', 'MACD', etc.
  analysis TEXT,
  accuracy_rate NUMERIC,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.binary_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reward_amount NUMERIC DEFAULT 0,
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS on new tables
ALTER TABLE public.binary_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_timeframes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_market_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_risk_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Assets are public to view
CREATE POLICY "Binary assets are public" ON public.binary_assets
  FOR SELECT USING (true);

-- Timeframes are public to view
CREATE POLICY "Binary timeframes are public" ON public.binary_timeframes
  FOR SELECT USING (true);

-- Market settings viewable by all, editable by admins
CREATE POLICY "Market settings are public to view" ON public.binary_market_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update market settings" ON public.binary_market_settings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Price history is public
CREATE POLICY "Price history is public" ON public.binary_price_history
  FOR SELECT USING (true);

-- Leaderboard is public
CREATE POLICY "Leaderboard is public" ON public.binary_leaderboard
  FOR SELECT USING (true);

-- Users can view and update their risk settings
CREATE POLICY "Users can view own risk settings" ON public.binary_risk_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own risk settings" ON public.binary_risk_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own risk settings" ON public.binary_risk_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trading signals are public
CREATE POLICY "Trading signals are public" ON public.binary_trading_signals
  FOR SELECT USING (is_active = true);

-- Users can view their achievements
CREATE POLICY "Users can view own achievements" ON public.binary_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to generate price movements
CREATE OR REPLACE FUNCTION public.simulate_price_movement(
  p_asset_id UUID,
  p_current_price NUMERIC,
  p_volatility NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  v_change_percent NUMERIC;
  v_new_price NUMERIC;
BEGIN
  -- Generate random price change based on volatility
  v_change_percent := (RANDOM() - 0.5) * 2 * p_volatility;
  v_new_price := p_current_price * (1 + v_change_percent);
  
  -- Ensure price doesn't go negative
  IF v_new_price <= 0 THEN
    v_new_price := p_current_price * 0.99;
  END IF;
  
  RETURN ROUND(v_new_price, 4);
END;
$$ LANGUAGE plpgsql;

-- Create function to update leaderboard
CREATE OR REPLACE FUNCTION public.update_binary_leaderboard() 
RETURNS void AS $$
BEGIN
  -- Update daily leaderboard
  INSERT INTO public.binary_leaderboard (
    user_id, period, period_start, total_trades, wins, losses, 
    win_rate, total_profit, total_volume
  )
  SELECT 
    user_id,
    'daily',
    CURRENT_DATE,
    COUNT(*),
    SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END),
    SUM(CASE WHEN profit_loss <= 0 THEN 1 ELSE 0 END),
    CASE 
      WHEN COUNT(*) > 0 
      THEN (SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100
      ELSE 0
    END,
    SUM(profit_loss),
    SUM(stake_amount)
  FROM public.binary_options_trades
  WHERE DATE(created_at) = CURRENT_DATE
    AND status IN ('won', 'lost')
  GROUP BY user_id
  ON CONFLICT (user_id, period, period_start) 
  DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    win_rate = EXCLUDED.win_rate,
    total_profit = EXCLUDED.total_profit,
    total_volume = EXCLUDED.total_volume,
    updated_at = now();
    
  -- Update rankings
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY period, period_start 
        ORDER BY total_profit DESC
      ) as new_rank
    FROM public.binary_leaderboard
    WHERE period = 'daily' AND period_start = CURRENT_DATE
  )
  UPDATE public.binary_leaderboard l
  SET rank = r.new_rank
  FROM ranked r
  WHERE l.id = r.id;
END;
$$ LANGUAGE plpgsql;