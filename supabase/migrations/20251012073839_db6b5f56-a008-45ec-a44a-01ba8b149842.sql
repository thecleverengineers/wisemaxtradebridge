-- Fix trigger function to have proper search_path
DROP FUNCTION IF EXISTS public.update_achievement_progress_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_achievement_progress_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_user_achievement_progress_updated_at ON public.user_achievement_progress;

CREATE TRIGGER update_user_achievement_progress_updated_at
BEFORE UPDATE ON public.user_achievement_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_achievement_progress_updated_at();