-- Fix transactions table schema and update withdrawal functions

-- Ensure transactions table has required columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'transactions' 
                 AND column_name = 'completed_at') THEN
    ALTER TABLE public.transactions ADD COLUMN completed_at timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'transactions' 
                 AND column_name = 'rejected_at') THEN
    ALTER TABLE public.transactions ADD COLUMN rejected_at timestamp with time zone;
  END IF;
END $$;

-- Drop and recreate approve_withdrawal function with proper RLS bypass
DROP FUNCTION IF EXISTS public.approve_withdrawal(uuid);

CREATE OR REPLACE FUNCTION public.approve_withdrawal(p_transaction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction RECORD;
  v_admin_id uuid;
BEGIN
  -- Get the authenticated user ID
  v_admin_id := auth.uid();
  
  -- Check if user is admin or super_admin
  IF NOT (has_role(v_admin_id, 'admin') OR has_role(v_admin_id, 'super_admin')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin or Super Admin role required');
  END IF;

  -- Get transaction details (bypass RLS by using SECURITY DEFINER privileges)
  SELECT * INTO v_transaction
  FROM public.transactions
  WHERE id = p_transaction_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found or already processed');
  END IF;

  -- Update transaction status (this will bypass RLS due to SECURITY DEFINER)
  UPDATE public.transactions
  SET 
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Withdrawal approved successfully',
    'transaction_id', p_transaction_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', SQLERRM
    );
END;
$$;

-- Drop and recreate reject_withdrawal function with proper RLS bypass
DROP FUNCTION IF EXISTS public.reject_withdrawal(uuid);

CREATE OR REPLACE FUNCTION public.reject_withdrawal(p_transaction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction RECORD;
  v_admin_id uuid;
BEGIN
  -- Get the authenticated user ID
  v_admin_id := auth.uid();
  
  -- Check if user is admin or super_admin
  IF NOT (has_role(v_admin_id, 'admin') OR has_role(v_admin_id, 'super_admin')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin or Super Admin role required');
  END IF;

  -- Get transaction details (bypass RLS by using SECURITY DEFINER privileges)
  SELECT * INTO v_transaction
  FROM public.transactions
  WHERE id = p_transaction_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found or already processed');
  END IF;

  -- Update transaction status (this will bypass RLS due to SECURITY DEFINER)
  UPDATE public.transactions
  SET 
    status = 'rejected',
    rejected_at = now(),
    updated_at = now()
  WHERE id = p_transaction_id;

  -- Return amount to wallet and unlock (this will bypass RLS due to SECURITY DEFINER)
  UPDATE public.wallets
  SET 
    balance = balance + v_transaction.amount,
    locked_balance = GREATEST(0, locked_balance - v_transaction.amount),
    updated_at = now()
  WHERE user_id = v_transaction.user_id AND currency = v_transaction.currency;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Withdrawal rejected and ' || v_transaction.amount || ' ' || v_transaction.currency || ' returned to wallet',
    'transaction_id', p_transaction_id,
    'amount_returned', v_transaction.amount
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', SQLERRM
    );
END;
$$;