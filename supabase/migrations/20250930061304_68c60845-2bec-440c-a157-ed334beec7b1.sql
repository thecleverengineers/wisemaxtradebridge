-- First, update existing stocks with more realistic data
UPDATE public.stocks SET 
  price = CASE 
    WHEN symbol = 'RELIANCE' THEN 27.85
    WHEN symbol = 'TCS' THEN 40.12
    WHEN symbol = 'HDFC' THEN 18.65
    WHEN symbol = 'INFY' THEN 16.88
    WHEN symbol = 'ICICI' THEN 10.52
    WHEN symbol = 'WIPRO' THEN 4.92
    WHEN symbol = 'SBI' THEN 7.23
    WHEN symbol = 'BHARTI' THEN 10.85
    ELSE price
  END,
  previous_close = price,
  day_high = price * 1.02,
  day_low = price * 0.98,
  change_amount = 0,
  change_percent = 0,
  volume = FLOOR(RANDOM() * 1000000 + 100000),
  last_updated = now()
WHERE symbol IN ('RELIANCE', 'TCS', 'HDFC', 'INFY', 'ICICI', 'WIPRO', 'SBI', 'BHARTI');

-- Insert new diverse stocks (Tech, Finance, Energy, Retail, Pharma sectors)
INSERT INTO public.stocks (symbol, name, price, previous_close, change_amount, change_percent, volume, sector, day_high, day_low, market_cap)
VALUES 
  -- Technology stocks
  ('AAPL', 'Apple Inc', 225.30, 224.50, 0.80, 0.36, 52000000, 'Technology', 226.80, 223.10, 3450000000000),
  ('MSFT', 'Microsoft Corp', 430.15, 428.90, 1.25, 0.29, 24000000, 'Technology', 432.50, 427.30, 3200000000000),
  ('GOOGL', 'Alphabet Inc', 175.80, 174.20, 1.60, 0.92, 22000000, 'Technology', 177.20, 173.50, 2200000000000),
  
  -- Finance stocks  
  ('JPM', 'JP Morgan Chase', 195.60, 194.10, 1.50, 0.77, 10000000, 'Finance', 197.30, 193.80, 560000000000),
  ('BAC', 'Bank of America', 38.75, 38.20, 0.55, 1.44, 45000000, 'Finance', 39.10, 38.00, 300000000000),
  
  -- Energy stocks
  ('XOM', 'Exxon Mobil', 115.40, 114.80, 0.60, 0.52, 15000000, 'Energy', 116.50, 113.90, 460000000000),
  ('CVX', 'Chevron Corp', 162.30, 160.90, 1.40, 0.87, 8000000, 'Energy', 164.20, 160.50, 310000000000),
  
  -- Retail stocks
  ('AMZN', 'Amazon.com', 185.45, 183.20, 2.25, 1.23, 48000000, 'Retail', 187.80, 182.60, 1920000000000),
  ('WMT', 'Walmart Inc', 87.90, 87.10, 0.80, 0.92, 7000000, 'Retail', 88.60, 86.50, 238000000000),
  
  -- Pharmaceutical stocks
  ('JNJ', 'Johnson & Johnson', 155.20, 154.30, 0.90, 0.58, 6500000, 'Healthcare', 156.80, 153.70, 370000000000),
  ('PFE', 'Pfizer Inc', 28.60, 28.20, 0.40, 1.42, 32000000, 'Healthcare', 29.10, 28.00, 160000000000),
  
  -- Automotive
  ('TSLA', 'Tesla Inc', 245.80, 242.30, 3.50, 1.45, 95000000, 'Automotive', 249.20, 240.50, 780000000000),
  
  -- Semiconductor
  ('NVDA', 'NVIDIA Corp', 132.50, 130.20, 2.30, 1.77, 280000000, 'Technology', 135.40, 129.80, 3250000000000),
  
  -- Social Media
  ('META', 'Meta Platforms', 520.75, 516.40, 4.35, 0.84, 18000000, 'Technology', 525.30, 514.20, 1320000000000),
  
  -- Crypto/Finance
  ('COIN', 'Coinbase', 285.40, 280.60, 4.80, 1.71, 12000000, 'Finance', 290.20, 278.90, 65000000000)
ON CONFLICT (symbol) 
DO UPDATE SET 
  price = EXCLUDED.price,
  previous_close = EXCLUDED.previous_close,
  change_amount = EXCLUDED.change_amount,
  change_percent = EXCLUDED.change_percent,
  volume = EXCLUDED.volume,
  day_high = EXCLUDED.day_high,
  day_low = EXCLUDED.day_low,
  market_cap = EXCLUDED.market_cap,
  last_updated = now();