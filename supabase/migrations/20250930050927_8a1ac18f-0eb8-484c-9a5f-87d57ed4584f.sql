-- Add new columns to roi_plans for enhanced features
ALTER TABLE public.roi_plans 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS activation_rules jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bonus_structure jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS plan_category text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS priority_order integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_users integer,
ADD COLUMN IF NOT EXISTS current_users integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS special_conditions jsonb DEFAULT '{}';

-- Insert innovative investment plans
INSERT INTO public.roi_plans (
  name, description, interest_rate, min_investment, max_investment,
  duration_value, duration_type, is_active, is_compounding,
  plan_type, plan_category, activation_rules, bonus_structure, priority_order, features
) VALUES 
-- Crypto-Inspired Plans
('Bitcoin Tracker', 'ROI fluctuates with BTC price movements (±2% daily)', 8.5, 500, 50000, 
 30, 'daily', true, true, 'dynamic', 'crypto', 
 '{"track_asset": "BTC", "volatility_factor": 2}', 
 '{"type": "market_linked", "base_rate": 8.5}', 10,
 '["BTC price tracking", "Daily adjustments", "Volatility bonus"]'::jsonb),

('DeFi Yield Hunter', 'Mimics DeFi staking returns with higher risk/reward', 15, 1000, 100000,
 90, 'daily', true, true, 'dynamic', 'crypto',
 '{"min_lock": 90, "yield_type": "variable"}',
 '{"type": "defi_yield", "apr_range": [10, 20]}', 15,
 '["Variable APY", "DeFi-inspired", "Auto-compound"]'::jsonb),

-- Gamified Plans
('Level Up Investor', 'Unlock higher returns as you progress through levels', 5, 100, 10000,
 30, 'daily', true, false, 'gamified', 'gaming',
 '{"levels": 10, "xp_per_day": 100}',
 '{"level_multipliers": [1, 1.2, 1.4, 1.6, 1.8, 2, 2.3, 2.6, 3, 3.5]}', 20,
 '["10 investment levels", "XP system", "Achievement badges"]'::jsonb),

('Lucky Strike Plan', 'Daily chance to win 2x-10x returns on interest', 6, 200, 20000,
 7, 'daily', true, false, 'gamified', 'gaming',
 '{"lottery_chance": 0.1, "multiplier_range": [2, 10]}',
 '{"type": "lottery", "base_rate": 6}', 25,
 '["Daily lottery", "Instant wins", "Multiplier bonuses"]'::jsonb),

-- Social Investment Plans
('Team Rocket', 'Invest with friends, unlock group bonuses', 7, 500, 50000,
 60, 'daily', true, true, 'social', 'social',
 '{"min_team_size": 3, "max_team_size": 10}',
 '{"team_bonus": {"3": 1.5, "5": 2, "10": 3}}', 30,
 '["Team investments", "Group bonuses", "Social leaderboard"]'::jsonb),

('Referral Maximizer', 'Bonus ROI for each active referral (up to +5%)', 8, 300, 30000,
 45, 'daily', true, false, 'social', 'social',
 '{"max_referral_bonus": 5, "per_referral": 0.5}',
 '{"type": "referral_based"}', 35,
 '["Referral bonuses", "+0.5% per referral", "Network growth rewards"]'::jsonb),

-- Sustainable & ESG Plans
('Green Earth Fund', 'Support eco projects, earn carbon credits as bonus', 9, 1000, 100000,
 180, 'daily', true, true, 'sustainable', 'esg',
 '{"carbon_credits": true, "eco_certified": true}',
 '{"type": "impact", "carbon_bonus": 2}', 40,
 '["Carbon credits", "ESG certified", "Impact reports"]'::jsonb),

('Social Impact Bond', 'Extra returns for completing social good tasks', 10, 500, 50000,
 90, 'daily', true, false, 'sustainable', 'esg',
 '{"tasks_required": true, "impact_multiplier": 1.5}',
 '{"task_completion_bonus": 2}', 45,
 '["Social tasks", "Impact tracking", "Charity donations"]'::jsonb),

-- Dynamic Market Plans
('Bull Run Accelerator', 'Returns increase in bull markets (up to 25% APY)', 12, 2000, 200000,
 30, 'daily', true, true, 'dynamic', 'market',
 '{"market_condition": "bull", "max_apy": 25}',
 '{"type": "market_sentiment", "range": [8, 25]}', 50,
 '["Market-linked", "Bull market bonus", "Dynamic APY"]'::jsonb),

('Volatility Harvester', 'Higher returns during high market volatility', 11, 1500, 150000,
 14, 'daily', true, false, 'dynamic', 'market',
 '{"vix_threshold": 20, "volatility_bonus": 5}',
 '{"type": "volatility_based"}', 55,
 '["Volatility bonus", "Risk premium", "Market tracking"]'::jsonb),

-- Special Event Plans
('Birthday Bonanza', 'Triple returns on your birthday week', 7, 100, 10000,
 365, 'daily', true, false, 'special', 'event',
 '{"event_type": "birthday", "multiplier": 3}',
 '{"birthday_multiplier": 3}', 60,
 '["Birthday bonus", "3x returns", "Annual celebration"]'::jsonb),

('Lunar Special', 'Bonus returns during full moon periods', 8.8, 888, 88888,
 28, 'daily', true, true, 'special', 'event',
 '{"lunar_tracking": true, "moon_bonus": 2}',
 '{"full_moon_multiplier": 1.88}', 65,
 '["Lunar calendar", "Moon phase bonus", "Mystical returns"]'::jsonb),

-- Security-First Plans
('Fort Knox Vault', 'Guaranteed returns with insurance protection', 6, 5000, 500000,
 180, 'daily', true, true, 'secure', 'security',
 '{"insurance": true, "guaranteed": true}',
 '{"type": "guaranteed", "insurance_coverage": 100}', 70,
 '["100% insured", "Guaranteed returns", "Capital protection"]'::jsonb),

('Privacy Shield', 'Anonymous investment with enhanced security', 7.5, 1000, 100000,
 60, 'daily', true, false, 'secure', 'security',
 '{"anonymous": true, "enhanced_security": true}',
 '{"privacy_bonus": 1}', 75,
 '["Anonymous", "Enhanced security", "Privacy protection"]'::jsonb),

-- Next-Gen Features
('AI Optimizer', 'AI adjusts your returns based on market analysis', 10, 2000, 200000,
 30, 'daily', true, true, 'ai', 'innovation',
 '{"ai_enabled": true, "optimization_frequency": "daily"}',
 '{"type": "ai_optimized", "range": [8, 15]}', 80,
 '["AI-powered", "Smart optimization", "Machine learning"]'::jsonb),

('Quantum Leap', 'Revolutionary quantum-computed investment strategies', 20, 10000, 1000000,
 90, 'daily', true, true, 'ai', 'innovation',
 '{"quantum": true, "advanced_computing": true}',
 '{"type": "quantum", "complexity_bonus": 5}', 85,
 '["Quantum computing", "Advanced algorithms", "Future tech"]'::jsonb),

-- Flash Plans
('24-Hour Flash', 'Limited time mega returns - first 100 users only', 50, 100, 5000,
 1, 'daily', true, false, 'flash', 'limited',
 '{"max_users": 100, "time_limit": 24}',
 '{"type": "flash", "urgency_bonus": 10}', 5,
 '["24-hour only", "Limited slots", "50% daily returns"]'::jsonb),

('Weekend Warrior', 'Active only on weekends with 2x returns', 14, 500, 50000,
 2, 'daily', true, false, 'flash', 'limited',
 '{"active_days": ["saturday", "sunday"]}',
 '{"weekend_multiplier": 2}', 90,
 '["Weekend only", "2x returns", "TGIF bonus"]'::jsonb),

-- Hybrid Finance
('Stake & Trade Combo', 'Combines staking with trading profits', 12, 3000, 300000,
 60, 'daily', true, true, 'hybrid', 'defi',
 '{"combines": ["staking", "trading"]}',
 '{"staking_portion": 0.7, "trading_portion": 0.3}', 95,
 '["Dual strategy", "Staking + Trading", "Hybrid returns"]'::jsonb),

('NFT Yield Farm', 'Earn NFT rewards alongside regular returns', 10, 1000, 100000,
 30, 'daily', true, false, 'hybrid', 'defi',
 '{"nft_rewards": true, "collection": "premium"}',
 '{"nft_drop_chance": 0.01}', 100,
 '["NFT rewards", "Digital collectibles", "Bonus yields"]'::jsonb);

-- Create investment milestones table for gamification
CREATE TABLE IF NOT EXISTS public.investment_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  milestone_type text NOT NULL,
  milestone_value numeric NOT NULL,
  achieved_at timestamp with time zone,
  reward_type text,
  reward_value numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on milestones
ALTER TABLE public.investment_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for milestones
CREATE POLICY "Users can view their own milestones" 
ON public.investment_milestones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create milestones" 
ON public.investment_milestones 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create plan events table for special events
CREATE TABLE IF NOT EXISTS public.plan_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES public.roi_plans(id),
  event_name text NOT NULL,
  event_type text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  bonus_multiplier numeric DEFAULT 1,
  max_participants integer,
  current_participants integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on plan events
ALTER TABLE public.plan_events ENABLE ROW LEVEL SECURITY;

-- Public can view active events
CREATE POLICY "Everyone can view active events" 
ON public.plan_events 
FOR SELECT 
USING (true);

-- Update the ROI calculation trigger to handle new plan types
CREATE OR REPLACE FUNCTION public.calculate_dynamic_roi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  plan_record RECORD;
  base_rate numeric;
  final_rate numeric;
  bonus_multiplier numeric := 1;
BEGIN
  -- Get plan details
  SELECT * INTO plan_record FROM public.roi_plans WHERE id = NEW.plan_id;
  
  base_rate := COALESCE(NEW.custom_interest_rate, plan_record.interest_rate);
  final_rate := base_rate;
  
  -- Apply dynamic adjustments based on plan type
  CASE plan_record.plan_type
    WHEN 'dynamic' THEN
      -- Add market-based adjustments
      final_rate := base_rate * (1 + (RANDOM() * 0.4 - 0.2)); -- ±20% variance
    WHEN 'gamified' THEN
      -- Add level or achievement bonuses
      bonus_multiplier := 1 + (COALESCE(NEW.user_level, 0) * 0.1);
      final_rate := base_rate * bonus_multiplier;
    WHEN 'social' THEN
      -- Add referral bonuses
      SELECT COUNT(*) * 0.5 INTO bonus_multiplier 
      FROM public.referrals 
      WHERE referrer_id = NEW.user_id AND status = 'active';
      final_rate := base_rate + LEAST(bonus_multiplier, 5); -- Max 5% bonus
    WHEN 'flash' THEN
      -- Time-limited higher rates
      IF now() < NEW.created_at + INTERVAL '24 hours' THEN
        final_rate := base_rate * 2;
      END IF;
  END CASE;
  
  -- Store the calculated rate
  NEW.custom_interest_rate := final_rate;
  
  RETURN NEW;
END;
$function$;