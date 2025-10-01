-- =====================================================
-- ADMIN FEATURES DATABASE MIGRATION
-- =====================================================

-- 1. DEPOSIT WALLETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deposit_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL,
  currency TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_label TEXT,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT true,
  show_qr_code BOOLEAN DEFAULT false,
  require_confirmation BOOLEAN DEFAULT false,
  min_deposit_amount NUMERIC DEFAULT 0,
  network_fee_notice TEXT,
  auto_detect_transactions BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID,
  UNIQUE(network, currency)
);

-- Enable RLS
ALTER TABLE public.deposit_wallets ENABLE ROW LEVEL SECURITY;

-- Policies for deposit wallets
CREATE POLICY "Public can view active deposit wallets" 
ON public.deposit_wallets 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage deposit wallets" 
ON public.deposit_wallets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::text));

-- 2. DEPOSIT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deposit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_id UUID REFERENCES public.deposit_wallets(id),
  transaction_hash TEXT UNIQUE,
  network TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  from_address TEXT,
  to_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  confirmations INTEGER DEFAULT 0,
  required_confirmations INTEGER DEFAULT 1,
  admin_notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for deposit transactions
CREATE POLICY "Users can view their own deposits" 
ON public.deposit_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits" 
ON public.deposit_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposits" 
ON public.deposit_transactions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update deposits" 
ON public.deposit_transactions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::text));

-- 3. WITHDRAWAL REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  currency TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  network TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'completed', 'rejected', 'cancelled')),
  transaction_hash TEXT,
  processing_fee NUMERIC DEFAULT 0,
  net_amount NUMERIC,
  admin_notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policies for withdrawal requests
CREATE POLICY "Users can view their own withdrawals" 
ON public.withdrawal_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals" 
ON public.withdrawal_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" 
ON public.withdrawal_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update withdrawals" 
ON public.withdrawal_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::text));

-- 4. WEBSITE SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.website_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT DEFAULT 'string',
  display_name TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(setting_category, setting_key)
);

-- Enable RLS
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Policies for website settings
CREATE POLICY "Public can view public settings" 
ON public.website_settings 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Authenticated users can view all settings" 
ON public.website_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage settings" 
ON public.website_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::text));

-- 5. USER LEVELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE,
  level_name TEXT NOT NULL,
  min_investment NUMERIC NOT NULL,
  max_investment NUMERIC,
  benefits JSONB DEFAULT '[]'::jsonb,
  roi_bonus_percent NUMERIC DEFAULT 0,
  referral_bonus_percent NUMERIC DEFAULT 0,
  withdrawal_limit NUMERIC,
  badge_color TEXT,
  badge_icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Policies for user levels
CREATE POLICY "Everyone can view active levels" 
ON public.user_levels 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage levels" 
ON public.user_levels 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::text));

-- 6. USER LEVEL ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_level_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  level_id UUID REFERENCES public.user_levels(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_manual BOOLEAN DEFAULT false,
  assigned_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_level_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for user level assignments
CREATE POLICY "Users can view their own level" 
ON public.user_level_assignments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage level assignments" 
ON public.user_level_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::text));

-- 7. REWARD PROGRAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reward_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_name TEXT NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('daily', 'weekly', 'monthly', 'achievement', 'referral', 'investment', 'trading')),
  description TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('fixed', 'percentage', 'bonus', 'multiplier')),
  reward_value NUMERIC NOT NULL,
  min_requirement NUMERIC,
  max_reward NUMERIC,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  conditions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_programs ENABLE ROW LEVEL SECURITY;

-- Policies for reward programs
CREATE POLICY "Everyone can view active reward programs" 
ON public.reward_programs 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage reward programs" 
ON public.reward_programs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::text));

-- 8. USER REWARDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_id UUID REFERENCES public.reward_programs(id),
  reward_amount NUMERIC NOT NULL,
  reward_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled')),
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  transaction_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for user rewards
CREATE POLICY "Users can view their own rewards" 
ON public.user_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user rewards" 
ON public.user_rewards 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::text));

-- 9. ADMIN ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for admin activity logs
CREATE POLICY "Admins can view activity logs" 
ON public.admin_activity_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "System can create logs" 
ON public.admin_activity_logs 
FOR INSERT 
WITH CHECK (auth.uid() = admin_id);

-- 10. SYSTEM ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'maintenance')),
  priority INTEGER DEFAULT 0,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'users', 'admins', 'vip')),
  is_active BOOLEAN DEFAULT true,
  show_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  show_until TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- Policies for system announcements
CREATE POLICY "Everyone can view active announcements" 
ON public.system_announcements 
FOR SELECT 
USING (is_active = true AND now() >= show_from AND (show_until IS NULL OR now() <= show_until));

CREATE POLICY "Admins can manage announcements" 
ON public.system_announcements 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::text));

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF auth.uid() IS NOT NULL THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_deposit_wallets_updated_at
BEFORE UPDATE ON public.deposit_wallets
FOR EACH ROW EXECUTE FUNCTION public.update_admin_updated_at();

CREATE TRIGGER update_deposit_transactions_updated_at
BEFORE UPDATE ON public.deposit_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_settings_updated_at
BEFORE UPDATE ON public.website_settings
FOR EACH ROW EXECUTE FUNCTION public.update_admin_updated_at();

CREATE TRIGGER update_user_levels_updated_at
BEFORE UPDATE ON public.user_levels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_level_assignments_updated_at
BEFORE UPDATE ON public.user_level_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_programs_updated_at
BEFORE UPDATE ON public.reward_programs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_rewards_updated_at
BEFORE UPDATE ON public.user_rewards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_announcements_updated_at
BEFORE UPDATE ON public.system_announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default website settings
INSERT INTO public.website_settings (setting_category, setting_key, setting_value, display_name, description, is_public)
VALUES 
  ('general', 'site_name', '"LakToken"', 'Site Name', 'The name of the website', true),
  ('general', 'maintenance_mode', 'false', 'Maintenance Mode', 'Enable/disable maintenance mode', true),
  ('trading', 'min_deposit', '10', 'Minimum Deposit', 'Minimum deposit amount in USDT', true),
  ('trading', 'max_deposit', '100000', 'Maximum Deposit', 'Maximum deposit amount in USDT', true),
  ('trading', 'min_withdrawal', '10', 'Minimum Withdrawal', 'Minimum withdrawal amount in USDT', true),
  ('trading', 'max_withdrawal', '50000', 'Maximum Withdrawal', 'Maximum withdrawal amount in USDT', true),
  ('trading', 'withdrawal_fee', '2', 'Withdrawal Fee', 'Withdrawal fee percentage', true),
  ('referral', 'enabled', 'true', 'Referral System', 'Enable/disable referral system', false),
  ('referral', 'default_commission', '10', 'Default Commission', 'Default referral commission percentage', false)
ON CONFLICT (setting_category, setting_key) DO NOTHING;

-- Insert default user levels
INSERT INTO public.user_levels (level_number, level_name, min_investment, max_investment, roi_bonus_percent, referral_bonus_percent, badge_color, is_active)
VALUES 
  (1, 'Bronze', 0, 999, 0, 0, '#CD7F32', true),
  (2, 'Silver', 1000, 4999, 2, 1, '#C0C0C0', true),
  (3, 'Gold', 5000, 19999, 5, 2, '#FFD700', true),
  (4, 'Platinum', 20000, 49999, 8, 3, '#E5E4E2', true),
  (5, 'Diamond', 50000, 99999, 12, 5, '#B9F2FF', true),
  (6, 'Elite', 100000, NULL, 15, 7, '#FF1493', true)
ON CONFLICT (level_number) DO NOTHING;

-- Insert sample deposit wallets
INSERT INTO public.deposit_wallets (network, currency, wallet_address, wallet_label, is_active)
VALUES 
  ('BEP20', 'USDT', 'TCvp3vRbjMnJZBUuWRmjmLaXtWHKCdnc8E', 'USDT BEP20 Main Wallet', true),
  ('TRC20', 'USDT', 'TN9RRaXkCFtTXRso2GdTZxSxxwufzxLQPP', 'USDT TRC20 Main Wallet', true),
  ('Bitcoin', 'BTC', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'Bitcoin Main Wallet', true),
  ('Ethereum', 'ETH', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', 'Ethereum Main Wallet', true)
ON CONFLICT (network, currency) DO NOTHING;