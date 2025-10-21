-- Add minimum_deposit_amount column to deposit_wallets table
ALTER TABLE public.deposit_wallets 
ADD COLUMN minimum_deposit_amount numeric DEFAULT 0 NOT NULL;