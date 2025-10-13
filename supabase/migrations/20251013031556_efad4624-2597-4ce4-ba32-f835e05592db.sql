-- Create a public users view that combines auth.users with profiles
CREATE OR REPLACE VIEW public.users AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.phone,
  p.referral_code,
  p.referred_by,
  p.created_at,
  p.updated_at,
  COALESCE(w.balance, 0) as balance,
  COALESCE(w.total_deposited, 0) as total_deposited,
  COALESCE(w.roi_income, 0) as total_roi_earned,
  COALESCE(
    (SELECT SUM(amount) FROM public.investments WHERE user_id = p.id AND status = 'active'),
    0
  ) as total_investment,
  EXISTS(
    SELECT 1 FROM public.investments WHERE user_id = p.id AND status = 'active'
  ) as is_active
FROM public.profiles p
LEFT JOIN public.wallets w ON w.user_id = p.id;

-- Create staking_positions as an alias/view for staking_records
CREATE OR REPLACE VIEW public.staking_positions AS
SELECT * FROM public.staking_records;

-- Create deposit_wallets table for deposit tracking
CREATE TABLE IF NOT EXISTS public.deposit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  network TEXT NOT NULL DEFAULT 'TRC20',
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deposit_transactions table
CREATE TABLE IF NOT EXISTS public.deposit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USDT',
  network TEXT DEFAULT 'TRC20',
  tx_hash TEXT,
  from_address TEXT,
  to_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deposit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for deposit_wallets (public read for active wallets)
CREATE POLICY "Anyone can view active deposit wallets"
  ON public.deposit_wallets FOR SELECT
  USING (is_active = true);

-- RLS policies for deposit_transactions (user-specific)
CREATE POLICY "Users can view their own deposit transactions"
  ON public.deposit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposit transactions"
  ON public.deposit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deposit_transactions_user_id ON public.deposit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_transactions_status ON public.deposit_transactions(status);