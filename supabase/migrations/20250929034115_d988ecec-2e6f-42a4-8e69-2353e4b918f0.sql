-- Create forex pairs table
CREATE TABLE public.forex_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  current_price NUMERIC NOT NULL,
  previous_close NUMERIC,
  change_amount NUMERIC,
  change_percent NUMERIC,
  bid NUMERIC,
  ask NUMERIC,
  spread NUMERIC,
  daily_high NUMERIC,
  daily_low NUMERIC,
  daily_volume NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create forex signals table
CREATE TABLE public.forex_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID REFERENCES public.forex_pairs(id),
  signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold')),
  strength TEXT NOT NULL CHECK (strength IN ('strong', 'moderate', 'weak')),
  entry_price NUMERIC NOT NULL,
  take_profit_1 NUMERIC,
  take_profit_2 NUMERIC,
  take_profit_3 NUMERIC,
  stop_loss NUMERIC,
  analysis TEXT,
  accuracy_rate NUMERIC,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  timeframe TEXT,
  is_active BOOLEAN DEFAULT true,
  expired_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create forex positions table
CREATE TABLE public.forex_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pair_id UUID REFERENCES public.forex_pairs(id),
  signal_id UUID REFERENCES public.forex_signals(id),
  position_type TEXT NOT NULL CHECK (position_type IN ('buy', 'sell')),
  entry_price NUMERIC NOT NULL,
  current_price NUMERIC,
  volume NUMERIC NOT NULL,
  margin_used NUMERIC NOT NULL,
  leverage INTEGER DEFAULT 1,
  take_profit NUMERIC,
  stop_loss NUMERIC,
  profit_loss NUMERIC DEFAULT 0,
  profit_loss_percent NUMERIC DEFAULT 0,
  swap_fee NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  closed_price NUMERIC,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create forex orders table
CREATE TABLE public.forex_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  position_id UUID REFERENCES public.forex_positions(id),
  pair_id UUID REFERENCES public.forex_pairs(id),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  price NUMERIC NOT NULL,
  volume NUMERIC NOT NULL,
  filled_volume NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partial', 'cancelled', 'rejected')),
  executed_price NUMERIC,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forex_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forex_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forex_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forex_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forex_pairs (public read)
CREATE POLICY "Forex pairs are public" 
ON public.forex_pairs 
FOR SELECT 
USING (true);

-- RLS Policies for forex_signals (public read)
CREATE POLICY "Forex signals are public" 
ON public.forex_signals 
FOR SELECT 
USING (true);

-- RLS Policies for forex_positions
CREATE POLICY "Users can view their own positions" 
ON public.forex_positions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own positions" 
ON public.forex_positions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions" 
ON public.forex_positions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for forex_orders
CREATE POLICY "Users can view their own orders" 
ON public.forex_orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.forex_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
ON public.forex_orders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert sample forex pairs
INSERT INTO public.forex_pairs (symbol, base_currency, quote_currency, current_price, previous_close, bid, ask, spread, daily_high, daily_low, daily_volume)
VALUES 
  ('EUR/USD', 'EUR', 'USD', 1.0856, 1.0842, 1.0855, 1.0857, 0.0002, 1.0878, 1.0834, 2500000),
  ('GBP/USD', 'GBP', 'USD', 1.2745, 1.2721, 1.2744, 1.2746, 0.0002, 1.2768, 1.2712, 1800000),
  ('USD/JPY', 'USD', 'JPY', 149.85, 149.62, 149.84, 149.86, 0.02, 150.12, 149.45, 3200000),
  ('USD/CHF', 'USD', 'CHF', 0.8976, 0.8962, 0.8975, 0.8977, 0.0002, 0.8992, 0.8954, 1200000),
  ('AUD/USD', 'AUD', 'USD', 0.6523, 0.6512, 0.6522, 0.6524, 0.0002, 0.6538, 0.6508, 1500000),
  ('USD/CAD', 'USD', 'CAD', 1.3562, 1.3548, 1.3561, 1.3563, 0.0002, 1.3578, 1.3542, 900000),
  ('NZD/USD', 'NZD', 'USD', 0.5987, 0.5975, 0.5986, 0.5988, 0.0002, 0.5998, 0.5972, 600000),
  ('EUR/GBP', 'EUR', 'GBP', 0.8516, 0.8508, 0.8515, 0.8517, 0.0002, 0.8524, 0.8502, 800000);

-- Update change amounts and percentages
UPDATE public.forex_pairs 
SET 
  change_amount = current_price - previous_close,
  change_percent = ((current_price - previous_close) / previous_close) * 100;

-- Create trigger to update forex position profit/loss
CREATE OR REPLACE FUNCTION public.update_forex_position_pnl()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'open' THEN
    -- Calculate P&L based on position type
    IF NEW.position_type = 'buy' THEN
      NEW.profit_loss := (NEW.current_price - NEW.entry_price) * NEW.volume;
    ELSE -- sell position
      NEW.profit_loss := (NEW.entry_price - NEW.current_price) * NEW.volume;
    END IF;
    
    -- Calculate percentage
    NEW.profit_loss_percent := (NEW.profit_loss / NEW.margin_used) * 100;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_forex_position_pnl_trigger
BEFORE UPDATE ON public.forex_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_forex_position_pnl();

-- Enable realtime for forex tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.forex_pairs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forex_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forex_positions;