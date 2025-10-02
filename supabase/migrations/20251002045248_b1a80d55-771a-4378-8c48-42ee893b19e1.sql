-- Create Forex Trading Records table
CREATE TABLE IF NOT EXISTS public.forex_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pair_symbol TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop-limit')),
  position_type TEXT NOT NULL CHECK (position_type IN ('buy', 'sell')),
  volume NUMERIC NOT NULL CHECK (volume > 0),
  entry_price NUMERIC NOT NULL CHECK (entry_price > 0),
  current_price NUMERIC,
  leverage INTEGER DEFAULT 1 CHECK (leverage >= 1 AND leverage <= 100),
  margin_used NUMERIC NOT NULL CHECK (margin_used > 0),
  take_profit NUMERIC,
  stop_loss NUMERIC,
  profit_loss NUMERIC DEFAULT 0,
  profit_loss_percent NUMERIC DEFAULT 0,
  swap_fee NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  closed_price NUMERIC,
  closed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending', 'cancelled')),
  auto_close BOOLEAN DEFAULT false,
  close_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forex_records_user_id ON public.forex_records(user_id);
CREATE INDEX IF NOT EXISTS idx_forex_records_status ON public.forex_records(status);
CREATE INDEX IF NOT EXISTS idx_forex_records_pair_symbol ON public.forex_records(pair_symbol);
CREATE INDEX IF NOT EXISTS idx_forex_records_created_at ON public.forex_records(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.forex_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own forex records"
ON public.forex_records
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forex records"
ON public.forex_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forex records"
ON public.forex_records
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all forex records
CREATE POLICY "Admins can view all forex records"
ON public.forex_records
FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Admins can update all forex records
CREATE POLICY "Admins can update all forex records"
ON public.forex_records
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

-- Create trigger to update updated_at
CREATE TRIGGER update_forex_records_updated_at
BEFORE UPDATE ON public.forex_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate P&L
CREATE OR REPLACE FUNCTION public.calculate_forex_pnl()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only calculate for open positions with current price
  IF NEW.status = 'open' AND NEW.current_price IS NOT NULL THEN
    -- Calculate P&L based on position type
    IF NEW.position_type = 'buy' THEN
      NEW.profit_loss := (NEW.current_price - NEW.entry_price) * NEW.volume;
    ELSE -- sell position
      NEW.profit_loss := (NEW.entry_price - NEW.current_price) * NEW.volume;
    END IF;
    
    -- Calculate percentage
    NEW.profit_loss_percent := (NEW.profit_loss / NEW.margin_used) * 100;
    
    -- Deduct fees
    NEW.profit_loss := NEW.profit_loss - COALESCE(NEW.swap_fee, 0) - COALESCE(NEW.commission, 0);
  END IF;
  
  -- Auto-close on stop loss or take profit
  IF NEW.status = 'open' AND NEW.current_price IS NOT NULL THEN
    IF NEW.position_type = 'buy' THEN
      IF NEW.stop_loss IS NOT NULL AND NEW.current_price <= NEW.stop_loss THEN
        NEW.status := 'closed';
        NEW.closed_price := NEW.stop_loss;
        NEW.closed_at := now();
        NEW.close_reason := 'Stop Loss Hit';
      ELSIF NEW.take_profit IS NOT NULL AND NEW.current_price >= NEW.take_profit THEN
        NEW.status := 'closed';
        NEW.closed_price := NEW.take_profit;
        NEW.closed_at := now();
        NEW.close_reason := 'Take Profit Hit';
      END IF;
    ELSE -- sell position
      IF NEW.stop_loss IS NOT NULL AND NEW.current_price >= NEW.stop_loss THEN
        NEW.status := 'closed';
        NEW.closed_price := NEW.stop_loss;
        NEW.closed_at := now();
        NEW.close_reason := 'Stop Loss Hit';
      ELSIF NEW.take_profit IS NOT NULL AND NEW.current_price <= NEW.take_profit THEN
        NEW.status := 'closed';
        NEW.closed_price := NEW.take_profit;
        NEW.closed_at := now();
        NEW.close_reason := 'Take Profit Hit';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for P&L calculation
CREATE TRIGGER calculate_forex_pnl_trigger
BEFORE UPDATE ON public.forex_records
FOR EACH ROW
EXECUTE FUNCTION public.calculate_forex_pnl();

-- Create view for user trading summary
CREATE OR REPLACE VIEW public.user_forex_summary AS
SELECT 
  user_id,
  COUNT(*) as total_trades,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_positions,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_positions,
  SUM(CASE WHEN status = 'open' THEN margin_used ELSE 0 END) as total_margin_used,
  SUM(CASE WHEN status = 'closed' AND profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
  SUM(CASE WHEN status = 'closed' AND profit_loss <= 0 THEN 1 ELSE 0 END) as losing_trades,
  SUM(CASE WHEN status = 'closed' THEN profit_loss ELSE 0 END) as total_realized_pnl,
  SUM(CASE WHEN status = 'open' THEN profit_loss ELSE 0 END) as total_unrealized_pnl,
  AVG(CASE WHEN status = 'closed' AND profit_loss > 0 THEN profit_loss END) as avg_winning_trade,
  AVG(CASE WHEN status = 'closed' AND profit_loss < 0 THEN profit_loss END) as avg_losing_trade
FROM public.forex_records
GROUP BY user_id;