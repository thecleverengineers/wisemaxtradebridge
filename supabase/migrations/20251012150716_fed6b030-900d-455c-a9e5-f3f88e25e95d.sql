-- Add missing columns to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS network TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS to_address TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- Create forex_records table
CREATE TABLE IF NOT EXISTS public.forex_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pair_symbol TEXT NOT NULL,
  position_type TEXT NOT NULL,
  order_type TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  lot_size NUMERIC NOT NULL,
  leverage INTEGER DEFAULT 1,
  margin_used NUMERIC NOT NULL,
  profit_loss NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  swap NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'open',
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.forex_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own forex records"
  ON public.forex_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forex records"
  ON public.forex_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_forex_records_updated_at
  BEFORE UPDATE ON public.forex_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();