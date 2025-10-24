-- Migrate existing deposit records from transactions to deposit_transactions
INSERT INTO deposit_transactions (
  user_id,
  amount,
  currency,
  network,
  tx_hash,
  from_address,
  to_address,
  status,
  created_at,
  updated_at
)
SELECT 
  user_id,
  amount,
  COALESCE(currency, 'USDT') as currency,
  COALESCE(network, 'BEP20') as network,
  reference_id as tx_hash,
  NULL as from_address,
  to_address,
  status,
  created_at,
  NOW() as updated_at
FROM transactions
WHERE type = 'deposit'
  AND NOT EXISTS (
    SELECT 1 FROM deposit_transactions dt 
    WHERE dt.user_id = transactions.user_id 
      AND dt.amount = transactions.amount 
      AND dt.created_at = transactions.created_at
  );