-- Create enums for various statuses and types
CREATE TYPE public.kyc_status AS ENUM ('pending', 'in_review', 'approved', 'rejected');
CREATE TYPE public.trade_direction AS ENUM ('call', 'put', 'buy', 'sell');
CREATE TYPE public.trade_status AS ENUM ('pending', 'open', 'closed', 'cancelled', 'expired');
CREATE TYPE public.order_type AS ENUM ('market', 'limit', 'stop', 'stop_limit', 'oco');
CREATE TYPE public.order_status AS ENUM ('pending', 'filled', 'partial', 'cancelled', 'rejected');
CREATE TYPE public.asset_type AS ENUM ('crypto', 'forex', 'stock', 'commodity', 'index');
CREATE TYPE public.risk_profile AS ENUM ('conservative', 'moderate', 'balanced', 'growth', 'aggressive');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'trade', 'fee', 'bonus', 'transfer');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Enhanced users table with KYC and trading preferences
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS risk_profile risk_profile DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_demo_account BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trading_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_volume NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_loss NUMERIC DEFAULT 0;

-- Create assets table for all tradeable instruments
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type asset_type NOT NULL,
  exchange TEXT,
  description TEXT,
  logo_url TEXT,
  min_trade_amount NUMERIC DEFAULT 1,
  max_trade_amount NUMERIC DEFAULT 10000,
  leverage_available BOOLEAN DEFAULT false,
  max_leverage NUMERIC DEFAULT 1,
  maker_fee NUMERIC DEFAULT 0.001,
  taker_fee NUMERIC DEFAULT 0.001,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create market data table for real-time prices
CREATE TABLE IF NOT EXISTS public.market_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  bid NUMERIC,
  ask NUMERIC,
  high_24h NUMERIC,
  low_24h NUMERIC,
  volume_24h NUMERIC,
  change_24h NUMERIC,
  change_24h_percent NUMERIC,
  market_cap NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trades table for binary options style trades
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id),
  direction trade_direction NOT NULL,
  amount NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  duration INTEGER NOT NULL, -- in seconds
  payout_rate NUMERIC DEFAULT 0.85,
  profit_loss NUMERIC,
  status trade_status DEFAULT 'pending',
  is_demo BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create orders table for exchange-style trading
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id),
  type order_type NOT NULL,
  side trade_direction NOT NULL,
  quantity NUMERIC NOT NULL,
  price NUMERIC,
  stop_price NUMERIC,
  filled_quantity NUMERIC DEFAULT 0,
  average_fill_price NUMERIC,
  status order_status DEFAULT 'pending',
  is_demo BOOLEAN DEFAULT false,
  time_in_force TEXT DEFAULT 'GTC',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create positions table for margin/futures trading
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id),
  side trade_direction NOT NULL,
  quantity NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  current_price NUMERIC,
  leverage NUMERIC DEFAULT 1,
  margin NUMERIC NOT NULL,
  unrealized_pnl NUMERIC DEFAULT 0,
  realized_pnl NUMERIC DEFAULT 0,
  liquidation_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  is_open BOOLEAN DEFAULT true,
  is_demo BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced wallets table with multi-currency support
ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS demo_balance NUMERIC DEFAULT 10000,
ADD COLUMN IF NOT EXISTS locked_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS crypto_balances JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_deposits NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_withdrawals NUMERIC DEFAULT 0;

-- Create wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  status transaction_status DEFAULT 'pending',
  reference_id UUID,
  reference_type TEXT,
  payment_method TEXT,
  payment_details JSONB,
  fee NUMERIC DEFAULT 0,
  metadata JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create robo advisor profiles table
CREATE TABLE IF NOT EXISTS public.robo_advisor_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  investment_goal TEXT,
  investment_horizon INTEGER, -- in months
  monthly_investment NUMERIC,
  rebalance_frequency INTEGER DEFAULT 30, -- in days
  max_drawdown NUMERIC DEFAULT 0.2,
  target_return NUMERIC,
  is_active BOOLEAN DEFAULT false,
  last_rebalance_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create portfolio allocations table
CREATE TABLE IF NOT EXISTS public.portfolio_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.robo_advisor_profiles(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id),
  target_percentage NUMERIC NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
  current_percentage NUMERIC,
  current_value NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create strategies table
CREATE TABLE IF NOT EXISTS public.strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  risk_level risk_profile,
  expected_return NUMERIC,
  max_drawdown NUMERIC,
  win_rate NUMERIC,
  sharpe_ratio NUMERIC,
  parameters JSONB,
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  creator_id UUID REFERENCES public.users(id),
  subscribers_count INTEGER DEFAULT 0,
  total_pnl NUMERIC DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create copy trading table
CREATE TABLE IF NOT EXISTS public.copy_trading (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trader_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES public.strategies(id),
  allocation_amount NUMERIC NOT NULL,
  allocation_percentage NUMERIC,
  max_trades_per_day INTEGER DEFAULT 10,
  max_trade_size NUMERIC,
  stop_loss_percentage NUMERIC,
  take_profit_percentage NUMERIC,
  is_active BOOLEAN DEFAULT true,
  total_copied_trades INTEGER DEFAULT 0,
  total_profit_loss NUMERIC DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  stopped_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, trader_id)
);

-- Create signals table for trading signals
CREATE TABLE IF NOT EXISTS public.signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id),
  strategy_id UUID REFERENCES public.strategies(id),
  signal_type TEXT NOT NULL,
  direction trade_direction,
  strength INTEGER CHECK (strength >= 1 AND strength <= 5),
  entry_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 100),
  timeframe TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create watchlists table
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create watchlist items table
CREATE TABLE IF NOT EXISTS public.watchlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  alerts JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(watchlist_id, asset_id)
);

-- Create MT4 accounts table
CREATE TABLE IF NOT EXISTS public.mt4_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  server TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  investor_password_hash TEXT,
  balance NUMERIC,
  equity NUMERIC,
  margin NUMERIC,
  free_margin NUMERIC,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create API keys table for exchange integrations
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  api_secret_hash TEXT NOT NULL,
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_data_asset_timestamp ON public.market_data(asset_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON public.trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_user_open ON public.positions(user_id, is_open);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions_enhanced(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_signals_asset_expires ON public.signals(asset_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);

-- Enable Row Level Security on all tables
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robo_advisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_trading ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt4_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assets (public read)
CREATE POLICY "Assets are viewable by everyone" ON public.assets
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage assets" ON public.assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for market_data (public read)
CREATE POLICY "Market data is viewable by everyone" ON public.market_data
  FOR SELECT USING (true);

-- RLS Policies for trades
CREATE POLICY "Users can view their own trades" ON public.trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades" ON public.trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending trades" ON public.trades
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can cancel their own orders" ON public.orders
  FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- RLS Policies for positions
CREATE POLICY "Users can view their own positions" ON public.positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own positions" ON public.positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own open positions" ON public.positions
  FOR UPDATE USING (auth.uid() = user_id AND is_open = true);

-- RLS Policies for wallet_transactions_enhanced
CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions_enhanced
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for robo_advisor_profiles
CREATE POLICY "Users can view their own robo advisor profile" ON public.robo_advisor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own robo advisor profile" ON public.robo_advisor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own robo advisor profile" ON public.robo_advisor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for portfolio_allocations
CREATE POLICY "Users can view their own portfolio allocations" ON public.portfolio_allocations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.robo_advisor_profiles
      WHERE id = portfolio_allocations.profile_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for strategies
CREATE POLICY "Public strategies are viewable by everyone" ON public.strategies
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create their own strategies" ON public.strategies
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own strategies" ON public.strategies
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own strategies" ON public.strategies
  FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for copy_trading
CREATE POLICY "Users can view their own copy trading" ON public.copy_trading
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = trader_id);

CREATE POLICY "Users can create their own copy trading" ON public.copy_trading
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update their own copy trading" ON public.copy_trading
  FOR UPDATE USING (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own copy trading" ON public.copy_trading
  FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for signals
CREATE POLICY "Signals are viewable by authenticated users" ON public.signals
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for watchlists
CREATE POLICY "Users can view their own watchlists" ON public.watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watchlists" ON public.watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlists" ON public.watchlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists" ON public.watchlists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for watchlist_items
CREATE POLICY "Users can view their own watchlist items" ON public.watchlist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE id = watchlist_items.watchlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own watchlist items" ON public.watchlist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE id = watchlist_items.watchlist_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for mt4_accounts
CREATE POLICY "Users can view their own MT4 accounts" ON public.mt4_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own MT4 accounts" ON public.mt4_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MT4 accounts" ON public.mt4_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MT4 accounts" ON public.mt4_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for api_keys
CREATE POLICY "Users can view their own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for audit_logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Create functions for automated timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_enhanced_updated_at BEFORE UPDATE ON public.wallet_transactions_enhanced
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_robo_advisor_profiles_updated_at BEFORE UPDATE ON public.robo_advisor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_allocations_updated_at BEFORE UPDATE ON public.portfolio_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_copy_trading_updated_at BEFORE UPDATE ON public.copy_trading
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at BEFORE UPDATE ON public.watchlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mt4_accounts_updated_at BEFORE UPDATE ON public.mt4_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default assets
INSERT INTO public.assets (symbol, name, type, exchange, min_trade_amount, max_trade_amount, is_active, is_featured) VALUES
('BTCUSD', 'Bitcoin/USD', 'crypto', 'Binance', 10, 50000, true, true),
('ETHUSD', 'Ethereum/USD', 'crypto', 'Binance', 10, 50000, true, true),
('EURUSD', 'EUR/USD', 'forex', 'MT4', 10, 100000, true, true),
('GBPUSD', 'GBP/USD', 'forex', 'MT4', 10, 100000, true, true),
('AAPL', 'Apple Inc.', 'stock', 'NYSE', 10, 50000, true, true),
('GOOGL', 'Alphabet Inc.', 'stock', 'NASDAQ', 10, 50000, true, false),
('GOLD', 'Gold Spot', 'commodity', 'COMEX', 10, 100000, true, true),
('OIL', 'Crude Oil', 'commodity', 'NYMEX', 10, 50000, true, false),
('SPX500', 'S&P 500', 'index', 'CME', 10, 100000, true, true),
('DJI', 'Dow Jones', 'index', 'CME', 10, 100000, true, false)
ON CONFLICT (symbol) DO NOTHING;