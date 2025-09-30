-- Update stock prices to USDT values (converting from INR to USDT, approximately 1 USD = 83 INR)
UPDATE public.stocks SET 
  price = price / 83,
  previous_close = previous_close / 83,
  day_high = CASE WHEN day_high IS NOT NULL THEN day_high / 83 ELSE NULL END,
  day_low = CASE WHEN day_low IS NOT NULL THEN day_low / 83 ELSE NULL END,
  change_amount = change_amount / 83,
  last_updated = now();

-- Recalculate change percentages
UPDATE public.stocks 
SET change_percent = CASE 
  WHEN previous_close > 0 THEN ((price - previous_close) / previous_close) * 100 
  ELSE 0 
END;