-- Delete existing plans and insert 6 different investment plans
DELETE FROM public.investment_plans;

INSERT INTO public.investment_plans (name, min_amount, max_amount, daily_roi, duration_days, total_return_percent, status, created_at)
VALUES 
  ('Basic', 10, 500, 0.5, 30, 15, 'active', now()),
  ('Silver', 100, 1000, 0.8, 45, 36, 'active', now()),
  ('Gold', 500, 5000, 1.2, 60, 72, 'active', now()),
  ('Premium', 1000, 10000, 1.5, 90, 135, 'active', now()),
  ('Elite', 5000, 50000, 2.0, 120, 240, 'active', now()),
  ('Platinum', 10000, 100000, 2.5, 180, 450, 'active', now());