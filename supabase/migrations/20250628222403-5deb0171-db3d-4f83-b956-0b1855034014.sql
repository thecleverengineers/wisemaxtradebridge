
-- Fix the foreign key issue and recreate the failed tables
-- First, let's create the social_traders table correctly
CREATE TABLE IF NOT EXISTS social_traders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  trader_name VARCHAR(100),
  bio TEXT,
  total_followers INTEGER DEFAULT 0,
  total_return_percentage DECIMAL(8,4) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  risk_score DECIMAL(3,1) DEFAULT 5.0,
  is_verified BOOLEAN DEFAULT false,
  copy_trading_enabled BOOLEAN DEFAULT false,
  min_copy_amount DECIMAL(10,2) DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Now create copy_trades with correct foreign key reference
CREATE TABLE IF NOT EXISTS copy_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trader_id UUID REFERENCES users(id) ON DELETE CASCADE,
  allocation_amount DECIMAL(10,2) NOT NULL,
  allocation_percentage DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  total_copied_trades INTEGER DEFAULT 0,
  total_pnl DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Risk management
CREATE TABLE IF NOT EXISTS risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  risk_tolerance VARCHAR(20) DEFAULT 'moderate',
  max_position_size DECIMAL(5,2) DEFAULT 10.0,
  max_daily_loss DECIMAL(5,2) DEFAULT 5.0,
  var_limit DECIMAL(10,2),
  black_swan_protection BOOLEAN DEFAULT false,
  auto_stop_loss BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Portfolio analytics
CREATE TABLE IF NOT EXISTS portfolio_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_value DECIMAL(15,2),
  total_pnl DECIMAL(15,2),
  daily_pnl DECIMAL(15,2),
  sharpe_ratio DECIMAL(6,4),
  max_drawdown DECIMAL(5,2),
  beta DECIMAL(6,4),
  alpha DECIMAL(6,4),
  volatility DECIMAL(5,2),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Market sentiment and news
CREATE TABLE IF NOT EXISTS market_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol VARCHAR(20),
  sentiment_score DECIMAL(4,2),
  news_sentiment DECIMAL(4,2),
  social_sentiment DECIMAL(4,2),
  fear_greed_index INTEGER,
  volume_sentiment DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Web3 wallet connections
CREATE TABLE IF NOT EXISTS web3_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(100) NOT NULL,
  wallet_type VARCHAR(50),
  chain_id INTEGER,
  is_primary BOOLEAN DEFAULT false,
  nft_count INTEGER DEFAULT 0,
  defi_protocols JSON,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Automated trading rules
CREATE TABLE IF NOT EXISTS auto_trading_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rule_name VARCHAR(100) NOT NULL,
  asset_symbol VARCHAR(20),
  condition_type VARCHAR(50),
  condition_value DECIMAL(15,8),
  action_type VARCHAR(20),
  action_amount DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  executions_count INTEGER DEFAULT 0,
  last_executed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
