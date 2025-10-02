-- Create Transactions Records table
CREATE TABLE IF NOT EXISTS public.transactions_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('deposit', 'withdraw')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USDT',
  wallet_address TEXT,
  transaction_hash TEXT,
  network TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected')),
  payment_method TEXT,
  fee NUMERIC DEFAULT 0,
  net_amount NUMERIC,
  previous_balance NUMERIC,
  new_balance NUMERIC,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_records_user_id ON public.transactions_records(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_records_order_type ON public.transactions_records(order_type);
CREATE INDEX IF NOT EXISTS idx_transactions_records_status ON public.transactions_records(status);
CREATE INDEX IF NOT EXISTS idx_transactions_records_created_at ON public.transactions_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_records_currency ON public.transactions_records(currency);

-- Enable Row Level Security
ALTER TABLE public.transactions_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own transaction records"
ON public.transactions_records
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transaction records"
ON public.transactions_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending transaction records"
ON public.transactions_records
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all transaction records
CREATE POLICY "Admins can view all transaction records"
ON public.transactions_records
FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Admins can update all transaction records
CREATE POLICY "Admins can update all transaction records"
ON public.transactions_records
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

-- Create trigger to update updated_at
CREATE TRIGGER update_transactions_records_updated_at
BEFORE UPDATE ON public.transactions_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to process transaction
CREATE OR REPLACE FUNCTION public.process_transaction_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_balance NUMERIC;
  v_net_amount NUMERIC;
BEGIN
  -- Calculate net amount (amount - fee)
  NEW.net_amount := NEW.amount - COALESCE(NEW.fee, 0);
  
  -- Get current wallet balance
  SELECT balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = NEW.user_id AND currency = NEW.currency;
  
  IF v_wallet_balance IS NULL THEN
    v_wallet_balance := 0;
  END IF;
  
  NEW.previous_balance := v_wallet_balance;
  
  -- Process based on status change
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at := now();
    
    IF NEW.order_type = 'deposit' THEN
      -- Add to wallet balance
      NEW.new_balance := v_wallet_balance + NEW.net_amount;
      
      UPDATE public.wallets
      SET balance = balance + NEW.net_amount
      WHERE user_id = NEW.user_id AND currency = NEW.currency;
      
    ELSIF NEW.order_type = 'withdraw' THEN
      -- Check sufficient balance
      IF v_wallet_balance < NEW.amount THEN
        RAISE EXCEPTION 'Insufficient balance for withdrawal';
      END IF;
      
      -- Deduct from wallet balance
      NEW.new_balance := v_wallet_balance - NEW.amount;
      
      UPDATE public.wallets
      SET balance = balance - NEW.amount
      WHERE user_id = NEW.user_id AND currency = NEW.currency;
    END IF;
    
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    NEW.rejected_at := now();
    
    -- If it was a withdrawal that was pending, return the locked balance
    IF NEW.order_type = 'withdraw' AND OLD.status = 'pending' THEN
      UPDATE public.wallets
      SET locked_balance = GREATEST(0, locked_balance - NEW.amount)
      WHERE user_id = NEW.user_id AND currency = NEW.currency;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for transaction processing
CREATE TRIGGER process_transaction_record_trigger
BEFORE UPDATE ON public.transactions_records
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.process_transaction_record();

-- Create view for user transaction summary
CREATE OR REPLACE VIEW public.user_transaction_summary AS
SELECT 
  user_id,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN order_type = 'deposit' THEN 1 END) as total_deposits,
  COUNT(CASE WHEN order_type = 'withdraw' THEN 1 END) as total_withdrawals,
  SUM(CASE WHEN order_type = 'deposit' AND status = 'completed' THEN net_amount ELSE 0 END) as total_deposited,
  SUM(CASE WHEN order_type = 'withdraw' AND status = 'completed' THEN amount ELSE 0 END) as total_withdrawn,
  SUM(CASE WHEN status = 'completed' THEN fee ELSE 0 END) as total_fees_paid,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_transactions,
  MAX(created_at) as last_transaction_date
FROM public.transactions_records
GROUP BY user_id;