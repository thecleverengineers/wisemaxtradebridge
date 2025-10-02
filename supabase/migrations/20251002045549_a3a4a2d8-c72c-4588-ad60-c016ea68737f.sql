-- Create Binary Trading Records table
CREATE TABLE IF NOT EXISTS public.binary_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_pair TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('CALL', 'PUT')),
  stake_amount NUMERIC NOT NULL CHECK (stake_amount > 0),
  entry_price NUMERIC NOT NULL CHECK (entry_price > 0),
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_seconds INTEGER NOT NULL,
  exit_price NUMERIC,
  payout_rate NUMERIC NOT NULL DEFAULT 0.85,
  profit_loss NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'expired', 'cancelled')),
  is_demo BOOLEAN DEFAULT false,
  signal_strength TEXT,
  market_indicators JSONB,
  admin_forced_result TEXT CHECK (admin_forced_result IN ('WIN', 'LOSE', NULL)),
  settled_at TIMESTAMP WITH TIME ZONE,
  auto_trade BOOLEAN DEFAULT false,
  signal_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_binary_records_user_id ON public.binary_records(user_id);
CREATE INDEX IF NOT EXISTS idx_binary_records_status ON public.binary_records(status);
CREATE INDEX IF NOT EXISTS idx_binary_records_asset_pair ON public.binary_records(asset_pair);
CREATE INDEX IF NOT EXISTS idx_binary_records_expiry_time ON public.binary_records(expiry_time);
CREATE INDEX IF NOT EXISTS idx_binary_records_created_at ON public.binary_records(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.binary_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own binary records"
ON public.binary_records
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own binary records"
ON public.binary_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own binary records"
ON public.binary_records
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all binary records
CREATE POLICY "Admins can view all binary records"
ON public.binary_records
FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Admins can update all binary records
CREATE POLICY "Admins can update all binary records"
ON public.binary_records
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

-- Create trigger to update updated_at
CREATE TRIGGER update_binary_records_updated_at
BEFORE UPDATE ON public.binary_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to settle binary trades
CREATE OR REPLACE FUNCTION public.settle_binary_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_winner BOOLEAN;
  v_payout NUMERIC;
BEGIN
  -- Only process pending trades that have expired
  IF NEW.status = 'pending' AND now() >= NEW.expiry_time AND NEW.exit_price IS NOT NULL THEN
    
    -- Check for admin forced result
    IF NEW.admin_forced_result = 'WIN' THEN
      v_is_winner := true;
    ELSIF NEW.admin_forced_result = 'LOSE' THEN
      v_is_winner := false;
    ELSE
      -- Determine winner based on trade type and price movement
      IF NEW.trade_type = 'CALL' THEN
        v_is_winner := NEW.exit_price > NEW.entry_price;
      ELSE -- PUT
        v_is_winner := NEW.exit_price < NEW.entry_price;
      END IF;
    END IF;
    
    -- Calculate payout
    IF v_is_winner THEN
      v_payout := NEW.stake_amount * (1 + NEW.payout_rate);
      NEW.profit_loss := NEW.stake_amount * NEW.payout_rate;
      NEW.status := 'won';
      
      -- Update user wallet if not demo
      IF NOT NEW.is_demo THEN
        UPDATE public.wallets
        SET balance = balance + v_payout
        WHERE user_id = NEW.user_id AND currency = 'USDT';
      END IF;
    ELSE
      NEW.profit_loss := -NEW.stake_amount;
      NEW.status := 'lost';
    END IF;
    
    NEW.settled_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for trade settlement
CREATE TRIGGER settle_binary_record_trigger
BEFORE UPDATE ON public.binary_records
FOR EACH ROW
WHEN (NEW.status = 'pending' AND NEW.exit_price IS NOT NULL)
EXECUTE FUNCTION public.settle_binary_record();

-- Create view for user binary trading summary
CREATE OR REPLACE VIEW public.user_binary_summary AS
SELECT 
  user_id,
  COUNT(*) as total_trades,
  COUNT(CASE WHEN status = 'won' THEN 1 END) as winning_trades,
  COUNT(CASE WHEN status = 'lost' THEN 1 END) as losing_trades,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_trades,
  SUM(stake_amount) as total_staked,
  SUM(CASE WHEN status = 'won' THEN profit_loss ELSE 0 END) as total_profits,
  SUM(CASE WHEN status = 'lost' THEN ABS(profit_loss) ELSE 0 END) as total_losses,
  CASE 
    WHEN COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END) > 0 
    THEN (COUNT(CASE WHEN status = 'won' THEN 1 END)::NUMERIC / COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END)) * 100
    ELSE 0
  END as win_rate,
  MAX(created_at) as last_trade_date
FROM public.binary_records
WHERE NOT is_demo
GROUP BY user_id;

-- Create view for asset performance
CREATE OR REPLACE VIEW public.binary_asset_performance AS
SELECT 
  asset_pair,
  COUNT(*) as total_trades,
  COUNT(CASE WHEN status = 'won' THEN 1 END) as wins,
  COUNT(CASE WHEN status = 'lost' THEN 1 END) as losses,
  AVG(stake_amount) as avg_stake,
  SUM(CASE WHEN status = 'won' THEN profit_loss ELSE 0 END) as total_profits,
  SUM(CASE WHEN status = 'lost' THEN ABS(profit_loss) ELSE 0 END) as total_losses
FROM public.binary_records
WHERE NOT is_demo AND status IN ('won', 'lost')
GROUP BY asset_pair;