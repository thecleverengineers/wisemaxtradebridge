-- Update approve_withdrawal function to handle both superadmin and super-admin roles
CREATE OR REPLACE FUNCTION public.approve_withdrawal(withdrawal_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_withdrawal_record RECORD;
  v_amount NUMERIC;
  v_user_id UUID;
BEGIN
  -- Check if user has admin or superadmin role
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'superadmin'::app_role) OR
    public.has_role(auth.uid(), 'super-admin'::app_role)
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Get withdrawal request details
  SELECT * INTO v_withdrawal_record
  FROM public.withdrawal_requests
  WHERE id = withdrawal_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Withdrawal request not found');
  END IF;

  IF v_withdrawal_record.status != 'pending' THEN
    RETURN json_build_object('success', false, 'message', 'Withdrawal request is not pending');
  END IF;

  v_amount := v_withdrawal_record.amount;
  v_user_id := v_withdrawal_record.user_id;

  -- Update withdrawal request status
  UPDATE public.withdrawal_requests
  SET 
    status = 'approved',
    processed_by = auth.uid(),
    processed_at = NOW()
  WHERE id = withdrawal_id;

  -- Deduct from user's wallet balance
  UPDATE public.wallets
  SET 
    balance = balance - v_amount,
    total_withdrawn = total_withdrawn + v_amount
  WHERE user_id = v_user_id;

  -- Create transaction record
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    currency,
    network,
    to_address,
    balance_after,
    reason,
    category,
    status
  ) VALUES (
    v_user_id,
    'debit',
    v_amount,
    'USDT',
    v_withdrawal_record.network,
    v_withdrawal_record.wallet_address,
    (SELECT balance FROM public.wallets WHERE user_id = v_user_id),
    'Withdrawal approved',
    'withdrawal',
    'completed'
  );

  RETURN json_build_object('success', true, 'message', 'Withdrawal approved successfully');
END;
$function$;

-- Update reject_withdrawal function to handle both superadmin and super-admin roles
CREATE OR REPLACE FUNCTION public.reject_withdrawal(withdrawal_id uuid, note text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_withdrawal_record RECORD;
BEGIN
  -- Check if user has admin or superadmin role
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'superadmin'::app_role) OR
    public.has_role(auth.uid(), 'super-admin'::app_role)
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Get withdrawal request details
  SELECT * INTO v_withdrawal_record
  FROM public.withdrawal_requests
  WHERE id = withdrawal_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Withdrawal request not found');
  END IF;

  IF v_withdrawal_record.status != 'pending' THEN
    RETURN json_build_object('success', false, 'message', 'Withdrawal request is not pending');
  END IF;

  -- Update withdrawal request status
  UPDATE public.withdrawal_requests
  SET 
    status = 'rejected',
    processed_by = auth.uid(),
    processed_at = NOW(),
    admin_note = note
  WHERE id = withdrawal_id;

  -- Create transaction record for rejected withdrawal (for audit trail)
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    currency,
    network,
    to_address,
    balance_after,
    reason,
    category,
    status,
    notes
  ) VALUES (
    v_withdrawal_record.user_id,
    'debit',
    v_withdrawal_record.amount,
    'USDT',
    v_withdrawal_record.network,
    v_withdrawal_record.wallet_address,
    (SELECT balance FROM public.wallets WHERE user_id = v_withdrawal_record.user_id),
    'Withdrawal rejected',
    'withdrawal',
    'rejected',
    note
  );

  RETURN json_build_object('success', true, 'message', 'Withdrawal rejected successfully');
END;
$function$;