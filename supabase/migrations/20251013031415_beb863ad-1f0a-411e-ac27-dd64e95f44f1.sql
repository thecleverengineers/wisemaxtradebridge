-- Create forex_pairs table for currency pair data
CREATE TABLE IF NOT EXISTS public.forex_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  current_price NUMERIC NOT NULL,
  previous_close NUMERIC NOT NULL,
  change_amount NUMERIC NOT NULL DEFAULT 0,
  change_percent NUMERIC NOT NULL DEFAULT 0,
  bid NUMERIC NOT NULL,
  ask NUMERIC NOT NULL,
  spread NUMERIC NOT NULL DEFAULT 0,
  daily_high NUMERIC NOT NULL,
  daily_low NUMERIC NOT NULL,
  daily_volume BIGINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forex_positions table for user trading positions
CREATE TABLE IF NOT EXISTS public.forex_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  pair_id UUID NOT NULL REFERENCES public.forex_pairs(id),
  signal_id UUID,
  position_type TEXT NOT NULL CHECK (position_type IN ('buy', 'sell')),
  entry_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  volume NUMERIC NOT NULL,
  margin_used NUMERIC NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  take_profit NUMERIC,
  stop_loss NUMERIC,
  profit_loss NUMERIC DEFAULT 0,
  profit_loss_percent NUMERIC DEFAULT 0,
  swap_fee NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_price NUMERIC,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forex_signals table for trading signals
CREATE TABLE IF NOT EXISTS public.forex_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES public.forex_pairs(id),
  signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell')),
  strength TEXT NOT NULL CHECK (strength IN ('weak', 'moderate', 'strong')),
  entry_price NUMERIC NOT NULL,
  take_profit_1 NUMERIC,
  take_profit_2 NUMERIC,
  take_profit_3 NUMERIC,
  stop_loss NUMERIC,
  analysis TEXT,
  accuracy_rate NUMERIC DEFAULT 0,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  timeframe TEXT DEFAULT '1H',
  is_active BOOLEAN DEFAULT true,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create binary_signals table for binary options signals
CREATE TABLE IF NOT EXISTS public.binary_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  strength TEXT NOT NULL CHECK (strength IN ('weak', 'moderate', 'strong')),
  entry_price NUMERIC NOT NULL,
  expiry_time TIMESTAMPTZ NOT NULL,
  analysis TEXT,
  accuracy_rate NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics table for dashboard analytics
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  total_loss NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create market_data table for market information
CREATE TABLE IF NOT EXISTS public.market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change_percent NUMERIC NOT NULL DEFAULT 0,
  volume NUMERIC NOT NULL DEFAULT 0,
  market_cap NUMERIC,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.forex_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forex_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forex_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forex_pairs (public read)
CREATE POLICY "Anyone can view forex pairs"
  ON public.forex_pairs FOR SELECT
  USING (true);

-- RLS Policies for forex_positions (user-specific)
CREATE POLICY "Users can view their own forex positions"
  ON public.forex_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forex positions"
  ON public.forex_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forex positions"
  ON public.forex_positions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for forex_signals (public read)
CREATE POLICY "Anyone can view forex signals"
  ON public.forex_signals FOR SELECT
  USING (true);

-- RLS Policies for binary_signals (public read)
CREATE POLICY "Anyone can view binary signals"
  ON public.binary_signals FOR SELECT
  USING (true);

-- RLS Policies for analytics (user-specific)
CREATE POLICY "Users can view their own analytics"
  ON public.analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON public.analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
  ON public.analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for market_data (public read)
CREATE POLICY "Anyone can view market data"
  ON public.market_data FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forex_positions_user_id ON public.forex_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_forex_positions_status ON public.forex_positions(status);
CREATE INDEX IF NOT EXISTS idx_forex_signals_is_active ON public.forex_signals(is_active);
CREATE INDEX IF NOT EXISTS idx_binary_signals_is_active ON public.binary_signals(is_active);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);