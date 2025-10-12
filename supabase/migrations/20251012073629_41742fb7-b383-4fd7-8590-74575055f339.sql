-- Create team_achievements table
CREATE TABLE IF NOT EXISTS public.team_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  milestone_amount NUMERIC NOT NULL,
  reward_amount NUMERIC NOT NULL,
  icon TEXT DEFAULT 'trophy',
  color TEXT DEFAULT 'gold',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_achievement_progress table
CREATE TABLE IF NOT EXISTS public.user_achievement_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.team_achievements(id) ON DELETE CASCADE,
  progress NUMERIC DEFAULT 0,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.team_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievement_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_achievements (public read)
CREATE POLICY "Anyone can view team achievements"
ON public.team_achievements
FOR SELECT
USING (true);

-- RLS Policies for user_achievement_progress
CREATE POLICY "Users can view their own achievement progress"
ON public.user_achievement_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievement progress"
ON public.user_achievement_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievement progress"
ON public.user_achievement_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to calculate team deposits
CREATE OR REPLACE FUNCTION public.calculate_team_deposits(referrer_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_deposits NUMERIC;
BEGIN
  -- Calculate total deposits from direct referrals
  SELECT COALESCE(SUM(w.total_deposited), 0)
  INTO total_deposits
  FROM public.wallets w
  INNER JOIN public.users u ON u.id = w.user_id
  WHERE u.referred_by = referrer_user_id;
  
  RETURN total_deposits;
END;
$$;

-- Insert default team achievements
INSERT INTO public.team_achievements (name, description, milestone_amount, reward_amount, icon, color)
VALUES 
  ('Team Starter', 'Achieve $1,000 in team deposits', 1000, 50, 'users', 'blue'),
  ('Team Builder', 'Achieve $5,000 in team deposits', 5000, 200, 'award', 'green'),
  ('Team Leader', 'Achieve $10,000 in team deposits', 10000, 500, 'trophy', 'gold'),
  ('Team Champion', 'Achieve $25,000 in team deposits', 25000, 1500, 'crown', 'purple'),
  ('Team Legend', 'Achieve $50,000 in team deposits', 50000, 3500, 'star', 'orange')
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_achievement_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_achievement_progress_updated_at
BEFORE UPDATE ON public.user_achievement_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_achievement_progress_updated_at();