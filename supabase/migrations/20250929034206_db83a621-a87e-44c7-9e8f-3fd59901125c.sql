-- Fix search_path for all remaining functions
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_user_profile(uuid) SET search_path = public;
ALTER FUNCTION public.process_roi_payouts() SET search_path = public;
ALTER FUNCTION public.handle_new_profile() SET search_path = public;
ALTER FUNCTION public.generate_unique_referral_code() SET search_path = public;
ALTER FUNCTION public.handle_new_user_registration() SET search_path = public;
ALTER FUNCTION public.process_referral_commission() SET search_path = public;