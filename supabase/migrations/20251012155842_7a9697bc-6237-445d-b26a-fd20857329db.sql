-- Fix search_path for security
ALTER FUNCTION public.get_user_achievement_tier(UUID) SET search_path = public;
ALTER FUNCTION public.get_tier_salary_amount(TEXT) SET search_path = public;