-- Create secure function to handle withdrawal approval
CREATE OR REPLACE FUNCTION public.approve_withdrawal(
  p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction RECORD;
  v_result JSONB;
BEGIN
  -- Check if user is admin or super_admin
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get transaction details
  SELECT * INTO v_transaction
  FROM public.transactions
  WHERE id = p_transaction_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found or already processed');
  END IF;

  -- Update transaction status
  UPDATE public.transactions
  SET 
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object('success', true, 'message', 'Withdrawal approved successfully');
END;
$$;

-- Create secure function to handle withdrawal rejection
CREATE OR REPLACE FUNCTION public.reject_withdrawal(
  p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction RECORD;
  v_wallet RECORD;
  v_result JSONB;
BEGIN
  -- Check if user is admin or super_admin
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get transaction details
  SELECT * INTO v_transaction
  FROM public.transactions
  WHERE id = p_transaction_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found or already processed');
  END IF;

  -- Get wallet details
  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = v_transaction.user_id AND currency = v_transaction.currency;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Update transaction status
  UPDATE public.transactions
  SET 
    status = 'rejected',
    rejected_at = now(),
    updated_at = now()
  WHERE id = p_transaction_id;

  -- Return amount to wallet and unlock
  UPDATE public.wallets
  SET 
    balance = balance + v_transaction.amount,
    locked_balance = GREATEST(0, locked_balance - v_transaction.amount),
    updated_at = now()
  WHERE user_id = v_transaction.user_id AND currency = v_transaction.currency;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Withdrawal rejected and ' || v_transaction.amount || ' ' || v_transaction.currency || ' returned to wallet'
  );
END;
$$;