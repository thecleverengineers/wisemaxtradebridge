-- Fix search_path for existing functions
ALTER FUNCTION public.update_forex_position_pnl() SET search_path = public;
ALTER FUNCTION public.calculate_user_stats() SET search_path = public;

-- Generate sample forex signals
INSERT INTO public.forex_signals (pair_id, signal_type, strength, entry_price, take_profit_1, take_profit_2, take_profit_3, stop_loss, analysis, accuracy_rate, risk_level, timeframe, is_active)
SELECT 
  fp.id,
  CASE WHEN RANDOM() > 0.5 THEN 'buy' ELSE 'sell' END,
  CASE 
    WHEN RANDOM() < 0.33 THEN 'strong'
    WHEN RANDOM() < 0.66 THEN 'moderate'
    ELSE 'weak'
  END,
  fp.current_price,
  fp.current_price * 1.01,
  fp.current_price * 1.02,
  fp.current_price * 1.03,
  fp.current_price * 0.98,
  'Technical analysis shows strong momentum with RSI at favorable levels',
  75 + RANDOM() * 20,
  CASE 
    WHEN RANDOM() < 0.33 THEN 'low'
    WHEN RANDOM() < 0.66 THEN 'medium'
    ELSE 'high'
  END,
  '4H',
  true
FROM public.forex_pairs fp
LIMIT 5;