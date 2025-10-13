-- Recreate place_binary_trade function
CREATE OR REPLACE FUNCTION public.place_binary_trade(
  p_asset text,
  p_direction text,
  p_amount numeric,
  p_entry_price numeric,
  p_duration integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_wallet_balance NUMERIC;
  v_trade_id UUID;
  result JSON;
BEGIN
  v_user_id := auth.uid();
  
  -- Check wallet balance
  SELECT balance INTO v_wallet_balance
  FROM public.wallets
  WHERE user_id = v_user_id;
  
  IF v_wallet_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient balance');
  END IF;
  
  -- Deduct amount from wallet
  UPDATE public.wallets
  SET balance = balance - p_amount,
      locked_balance = locked_balance + p_amount
  WHERE user_id = v_user_id;
  
  -- Create binary trade record
  INSERT INTO public.binary_records (
    user_id,
    asset,
    direction,
    amount,
    entry_price,
    duration,
    expiry_time,
    status
  ) VALUES (
    v_user_id,
    p_asset,
    p_direction,
    p_amount,
    p_entry_price,
    p_duration,
    NOW() + (p_duration || ' minutes')::INTERVAL,
    'pending'
  ) RETURNING id INTO v_trade_id;
  
  RETURN json_build_object('success', true, 'trade_id', v_trade_id, 'message', 'Trade placed successfully');
END;
$function$;