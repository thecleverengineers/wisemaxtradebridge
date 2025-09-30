-- Insert additional example ROI investment plans
INSERT INTO public.roi_plans (name, duration_type, duration_value, min_investment, max_investment, interest_rate, is_compounding, allow_early_withdrawal, withdrawal_penalty, description, features) VALUES
-- Hourly Plans
('Micro Trader', 'hourly', 12, 50, 5000, 0.25, false, true, 3, 'Ultra-short term trading returns', '["0.25% hourly", "12 hour cycle", "Low minimum investment"]'),
('Speed Returns', 'hourly', 48, 200, 20000, 0.75, false, true, 8, 'Quick 2-day investment cycle', '["0.75% hourly", "48 hour duration", "Medium risk-reward"]'),

-- Daily Plans
('Starter Daily', 'daily', 7, 100, 10000, 1.5, false, true, 5, 'Perfect for beginners - 1 week plan', '["1.5% daily", "7 day duration", "Beginner friendly"]'),
('Premium Daily', 'daily', 60, 1000, 100000, 3, true, true, 15, 'High-yield daily compounding', '["3% daily compound", "60 day duration", "Premium returns"]'),
('VIP Daily Elite', 'daily', 90, 5000, 500000, 4, true, false, 0, 'Exclusive VIP investment plan', '["4% daily compound", "90 day lock-in", "Maximum returns", "VIP support"]'),

-- Monthly Plans
('Monthly Starter', 'monthly', 3, 500, 25000, 10, false, true, 10, 'Short-term monthly returns', '["10% monthly", "3 month duration", "Flexible withdrawal"]'),
('Monthly Growth', 'monthly', 12, 2000, 200000, 20, true, true, 20, 'Full year monthly compounding', '["20% monthly compound", "12 month plan", "High growth potential"]'),
('Monthly Platinum', 'monthly', 24, 10000, 1000000, 30, true, false, 0, 'Ultimate long-term growth', '["30% monthly compound", "24 month commitment", "Platinum tier benefits"]'),

-- Quarterly Plans
('Quarter Starter', 'quarterly', 2, 1000, 50000, 15, false, true, 12, 'Semi-annual quarterly plan', '["15% per quarter", "6 month duration", "Moderate returns"]'),
('Quarter Pro', 'quarterly', 8, 10000, 500000, 35, true, true, 25, 'Professional quarterly investment', '["35% quarterly compound", "2 year plan", "Professional grade"]'),

-- Yearly Plans
('Annual Basic', 'yearly', 1, 5000, 250000, 80, false, true, 30, 'Simple annual investment', '["80% yearly", "1 year duration", "Stable returns"]'),
('Annual Supreme', 'yearly', 3, 20000, 2000000, 150, true, false, 0, 'Supreme long-term investment', '["150% yearly compound", "3 year lock-in", "Maximum growth", "Exclusive benefits"]'),

-- Custom Plans
('Flexible Lite', 'custom', 30, 50, 10000, 2, false, true, 3, 'Customizable light investment', '["Variable rates", "30 day default", "Full flexibility"]'),
('Flexible Pro', 'custom', 180, 500, 100000, 8, true, true, 10, 'Professional custom investment', '["Custom duration", "Compound available", "Advanced features"]'),
('Flexible Enterprise', 'custom', 365, 10000, null, 15, true, true, 20, 'Enterprise-grade custom plan', '["Unlimited investment", "Full customization", "Enterprise support", "Priority processing"]');

-- Update existing plans to make them more attractive
UPDATE public.roi_plans 
SET features = '["0.5% hourly returns", "24 hour duration", "Quick profits", "Instant withdrawal available"]'
WHERE name = 'Hourly Quick Returns';

UPDATE public.roi_plans 
SET features = '["2% daily returns", "30 day duration", "Steady income", "Daily payouts", "Popular choice"]'
WHERE name = 'Daily Growth Plan';

UPDATE public.roi_plans 
SET features = '["15% monthly compound", "6 month lock-in", "High yield", "Auto-compound feature", "Best seller"]'
WHERE name = 'Monthly Premium';

UPDATE public.roi_plans 
SET features = '["25% quarterly returns", "1 year duration", "VIP support", "Elite tier benefits", "Priority withdrawals"]'
WHERE name = 'Quarterly Elite';

UPDATE public.roi_plans 
SET features = '["120% annual compound", "2 year commitment", "Maximum returns", "Wealth building", "Long-term security"]'
WHERE name = 'Annual Wealth Builder';

UPDATE public.roi_plans 
SET features = '["Fully customizable", "Variable rates 1-50%", "Flexible duration", "Your rules", "No limits"]'
WHERE name = 'Custom Flex Plan';