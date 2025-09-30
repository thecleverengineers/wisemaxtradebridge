-- Create stocks table for intraday trading
CREATE TABLE public.stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  previous_close NUMERIC(10,2),
  change_amount NUMERIC(10,2) DEFAULT 0,
  change_percent NUMERIC(5,2) DEFAULT 0,
  day_high NUMERIC(10,2),
  day_low NUMERIC(10,2),
  volume BIGINT DEFAULT 0,
  market_cap BIGINT,
  sector TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create intraday positions table
CREATE TABLE public.intraday_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stock_id UUID REFERENCES public.stocks(id),
  position_type TEXT NOT NULL CHECK (position_type IN ('buy', 'sell')),
  quantity INTEGER NOT NULL,
  entry_price NUMERIC(10,2) NOT NULL,
  current_price NUMERIC(10,2),
  stop_loss NUMERIC(10,2),
  target_price NUMERIC(10,2),
  profit_loss NUMERIC(10,2) DEFAULT 0,
  profit_loss_percent NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  closed_price NUMERIC(10,2),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create intraday orders table
CREATE TABLE public.intraday_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stock_id UUID REFERENCES public.stocks(id),
  position_id UUID REFERENCES public.intraday_positions(id),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop_loss', 'bracket')),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  executed_price NUMERIC(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'rejected', 'partial')),
  executed_quantity INTEGER DEFAULT 0,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intraday_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intraday_orders ENABLE ROW LEVEL SECURITY;

-- Stocks are public to read
CREATE POLICY "Stocks are public to read"
ON public.stocks FOR SELECT
USING (true);

-- Users can manage their own positions
CREATE POLICY "Users can view their own positions"
ON public.intraday_positions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own positions"
ON public.intraday_positions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions"
ON public.intraday_positions FOR UPDATE
USING (auth.uid() = user_id);

-- Users can manage their own orders
CREATE POLICY "Users can view their own orders"
ON public.intraday_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON public.intraday_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
ON public.intraday_orders FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to update stock prices and calculate changes
CREATE OR REPLACE FUNCTION public.update_stock_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate change amount and percent
  IF NEW.previous_close IS NOT NULL AND NEW.previous_close > 0 THEN
    NEW.change_amount := NEW.price - NEW.previous_close;
    NEW.change_percent := (NEW.change_amount / NEW.previous_close) * 100;
  END IF;
  
  -- Update day high/low
  IF NEW.day_high IS NULL OR NEW.price > NEW.day_high THEN
    NEW.day_high := NEW.price;
  END IF;
  
  IF NEW.day_low IS NULL OR NEW.price < NEW.day_low THEN
    NEW.day_low := NEW.price;
  END IF;
  
  NEW.last_updated := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock price updates
CREATE TRIGGER update_stock_metrics_trigger
BEFORE UPDATE OF price ON public.stocks
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_metrics();

-- Create function to calculate position P&L
CREATE OR REPLACE FUNCTION public.calculate_position_pnl()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'open' AND NEW.current_price IS NOT NULL THEN
    -- Calculate P&L based on position type
    IF NEW.position_type = 'buy' THEN
      NEW.profit_loss := (NEW.current_price - NEW.entry_price) * NEW.quantity;
    ELSE -- sell position
      NEW.profit_loss := (NEW.entry_price - NEW.current_price) * NEW.quantity;
    END IF;
    
    -- Calculate percentage
    NEW.profit_loss_percent := (NEW.profit_loss / (NEW.entry_price * NEW.quantity)) * 100;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for position P&L calculation
CREATE TRIGGER calculate_position_pnl_trigger
BEFORE UPDATE ON public.intraday_positions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_position_pnl();

-- Insert initial stock data
INSERT INTO public.stocks (symbol, name, price, previous_close, volume, market_cap, sector) VALUES
('RELIANCE', 'Reliance Industries', 2456.50, 2450.00, 5234567, 1650000000000, 'Energy'),
('TCS', 'Tata Consultancy Services', 3567.25, 3550.00, 3456789, 1300000000000, 'Technology'),
('HDFCBANK', 'HDFC Bank', 1678.90, 1670.00, 8765432, 900000000000, 'Banking'),
('INFY', 'Infosys', 1456.75, 1450.00, 6543210, 600000000000, 'Technology'),
('ICICIBANK', 'ICICI Bank', 987.50, 980.00, 7654321, 690000000000, 'Banking'),
('BHARTIARTL', 'Bharti Airtel', 1234.60, 1230.00, 4567890, 730000000000, 'Telecom'),
('ITC', 'ITC Limited', 456.30, 455.00, 9876543, 560000000000, 'FMCG'),
('WIPRO', 'Wipro', 567.85, 565.00, 5432109, 310000000000, 'Technology'),
('SBIN', 'State Bank of India', 623.40, 620.00, 12345678, 556000000000, 'Banking'),
('HCLTECH', 'HCL Technologies', 1345.20, 1340.00, 3210987, 365000000000, 'Technology'),
('MARUTI', 'Maruti Suzuki', 10234.50, 10200.00, 2345678, 310000000000, 'Automobile'),
('ASIANPAINT', 'Asian Paints', 3456.70, 3440.00, 1234567, 330000000000, 'Paints'),
('AXISBANK', 'Axis Bank', 1123.45, 1120.00, 6789012, 345000000000, 'Banking'),
('TATAMOTORS', 'Tata Motors', 678.90, 675.00, 8901234, 250000000000, 'Automobile'),
('SUNPHARMA', 'Sun Pharmaceutical', 1234.55, 1230.00, 4567890, 296000000000, 'Pharma');

-- Enable realtime for stocks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.stocks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intraday_positions;