-- Enable realtime for team achievement tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_achievements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_achievements;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_achievement_progress') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievement_progress;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'referrals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
  END IF;
END $$;