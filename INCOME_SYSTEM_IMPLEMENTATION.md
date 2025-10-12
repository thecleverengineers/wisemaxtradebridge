# Income System Implementation Guide

## Overview
This document provides step-by-step instructions for implementing the new income structure with 20-level matrix commissions, 2× ROI cap, and direct referral bonuses.

## ✅ Completed Steps

### 1. Frontend Updates
- ✅ Updated `src/types/index.ts` with new income fields
- ✅ Created `src/types/income.ts` with level commission rates
- ✅ Updated `DashboardContent.tsx` to display all income types
- ✅ Updated `Referrals.tsx` with new commission rates (15%, 12%, 10%, etc.)
- ✅ Added new income cards for Daily Task, Daily Staking, Monthly Salary, Ultimate Bonoza

### 2. Backend Functions Created
- ✅ `calculate-daily-roi` - Calculates 0.3% daily ROI with 2× cap
- ✅ `process-level-income` - Processes 20-level commission structure
- ✅ Edge functions configured in `supabase/config.toml`

---

## 🔴 REQUIRED: Database Migration

**IMPORTANT:** You must run the following SQL in your Cloud Console to add the new database columns and tables.

### Step 1: Go to Cloud Console
1. Open your Lovable project
2. Navigate to the **Cloud** tab
3. Click **Open Cloud Console**
4. Go to **SQL Editor**

### Step 2: Run This SQL

```sql
-- Add new income columns to wallets table
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS daily_task_income DECIMAL(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_staking_income DECIMAL(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_salary DECIMAL(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultimate_bonoza DECIMAL(20, 8) DEFAULT 0;

-- Create income_transactions table
CREATE TABLE IF NOT EXISTS income_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_type TEXT NOT NULL CHECK (income_type IN ('roi', 'direct_referral', 'level_income', 'daily_task', 'staking', 'monthly_salary', 'rewards', 'ultimate_bonoza')),
  amount DECIMAL(20, 8) NOT NULL,
  source_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  level INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_transactions_user_id ON income_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_income_transactions_income_type ON income_transactions(income_type);
CREATE INDEX IF NOT EXISTS idx_income_transactions_created_at ON income_transactions(created_at DESC);

ALTER TABLE income_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own income transactions"
ON income_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update investment_plans
ALTER TABLE investment_plans
ADD COLUMN IF NOT EXISTS max_return_multiplier DECIMAL(4, 2) DEFAULT 2.0;

UPDATE investment_plans SET daily_roi = 0.3 WHERE daily_roi != 0.3;

-- Create user_level_qualifications table
CREATE TABLE IF NOT EXISTS user_level_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 20),
  direct_referrals_required INTEGER NOT NULL,
  direct_referrals_count INTEGER DEFAULT 0,
  is_qualified BOOLEAN DEFAULT FALSE,
  qualified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, level)
);

CREATE INDEX IF NOT EXISTS idx_level_qualifications_user_id ON user_level_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_level_qualifications_is_qualified ON user_level_qualifications(user_id, is_qualified);

ALTER TABLE user_level_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own level qualifications"
ON user_level_qualifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Initialize level qualifications for all existing users
INSERT INTO user_level_qualifications (user_id, level, direct_referrals_required)
SELECT u.id, l.level, l.required
FROM auth.users u
CROSS JOIN (
  VALUES 
    (1, 1), (2, 2), (3, 3), (4, 4), 
    (5, 5), (6, 5), (7, 5),
    (8, 6), (9, 6), (10, 6),
    (11, 7), (12, 7), (13, 7), (14, 7), (15, 7),
    (16, 8), (17, 8), (18, 8), (19, 8), (20, 8)
) AS l(level, required)
ON CONFLICT (user_id, level) DO NOTHING;

-- Add ROI tracking fields to user_investments
ALTER TABLE user_investments
ADD COLUMN IF NOT EXISTS total_roi_cap DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS roi_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS roi_completion_date TIMESTAMPTZ;

-- Calculate ROI cap for existing investments
UPDATE user_investments 
SET total_roi_cap = amount * 2 
WHERE total_roi_cap IS NULL;

-- Mark completed investments
UPDATE user_investments 
SET roi_completed = TRUE,
    roi_completion_date = NOW()
WHERE total_roi_earned >= total_roi_cap AND roi_completed = FALSE;

-- Function to update level qualifications
CREATE OR REPLACE FUNCTION update_level_qualifications()
RETURNS TRIGGER AS $$
BEGIN
  WITH referral_counts AS (
    SELECT 
      p.referrer_id,
      COUNT(*) as direct_count
    FROM profiles p
    WHERE p.referrer_id IS NOT NULL
    GROUP BY p.referrer_id
  )
  UPDATE user_level_qualifications ulq
  SET 
    direct_referrals_count = COALESCE(rc.direct_count, 0),
    is_qualified = (COALESCE(rc.direct_count, 0) >= ulq.direct_referrals_required),
    qualified_at = CASE 
      WHEN COALESCE(rc.direct_count, 0) >= ulq.direct_referrals_required AND ulq.qualified_at IS NULL 
      THEN NOW() 
      ELSE ulq.qualified_at 
    END,
    updated_at = NOW()
  FROM referral_counts rc
  WHERE ulq.user_id = rc.referrer_id
    AND (NEW.referrer_id = rc.referrer_id OR OLD.referrer_id = rc.referrer_id);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_level_qualifications ON profiles;
CREATE TRIGGER trigger_update_level_qualifications
AFTER INSERT OR UPDATE OF referrer_id OR DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_level_qualifications();

-- Function to process direct referral commission (5%)
CREATE OR REPLACE FUNCTION process_direct_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
  referrer_id UUID;
  commission_amount DECIMAL(20, 8);
BEGIN
  SELECT p.referrer_id INTO referrer_id
  FROM profiles p
  WHERE p.id = NEW.user_id;
  
  IF referrer_id IS NOT NULL THEN
    commission_amount := NEW.amount * 0.05;
    
    UPDATE wallets
    SET 
      referral_income = referral_income + commission_amount,
      total_balance = total_balance + commission_amount,
      updated_at = NOW()
    WHERE user_id = referrer_id;
    
    INSERT INTO income_transactions (
      user_id, income_type, amount, source_user_id, description
    ) VALUES (
      referrer_id, 'direct_referral', commission_amount, NEW.user_id,
      'Direct referral commission (5%) from investment of $' || NEW.amount
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_direct_referral_commission ON user_investments;
CREATE TRIGGER trigger_direct_referral_commission
AFTER INSERT ON user_investments
FOR EACH ROW
EXECUTE FUNCTION process_direct_referral_commission();
```

---

## 📋 Next Steps

### 3. Test the Implementation
After running the SQL:

1. **Test Direct Referral Commission**
   - Create a new investment with a referred user
   - Verify that 5% commission is credited to the referrer's wallet
   - Check `income_transactions` table for the record

2. **Test Level Qualifications**
   - Add direct referrals to a user
   - Verify that `user_level_qualifications` updates automatically
   - Check that levels unlock based on direct referral count

3. **Test ROI Calculation**
   - Call the `calculate-daily-roi` edge function manually or set up a cron job
   - Verify 0.3% daily ROI is credited
   - Confirm ROI stops at exactly 2× the investment amount

### 4. Set Up Automated ROI Calculation (Optional)
To automate daily ROI:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily ROI calculation at midnight
SELECT cron.schedule(
  'calculate-daily-roi',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT net.http_post(
    url:='https://verauoklhuanklwsuwrr.supabase.co/functions/v1/calculate-daily-roi',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

---

## 📊 New Income Structure Summary

| Income Type | Rate/Rule | Description |
|-------------|-----------|-------------|
| **Daily ROI** | 0.3% per day | Paid until 2× investment (200% total return) |
| **Direct Referral** | 5% | One-time bonus when direct referral invests |
| **Level 1** | 15% | Requires 1 direct referral |
| **Level 2** | 12% | Requires 2 direct referrals |
| **Level 3** | 10% | Requires 3 direct referrals |
| **Level 4** | 8% | Requires 4 direct referrals |
| **Levels 5-7** | 5% | Requires 5 direct referrals |
| **Levels 8-10** | 3% | Requires 6 direct referrals |
| **Levels 11-15** | 2% | Requires 7 direct referrals |
| **Levels 16-20** | 1% | Requires 8 direct referrals |
| **Daily Task** | Variable | Manual credit |
| **Daily Staking** | Variable | Manual credit |
| **Monthly Salary** | Variable | Manual credit |
| **Ultimate Bonoza** | Variable | Manual credit |

---

## 🎯 Features Implemented

✅ **20-Level Matrix Commission** - Users earn from 20 levels deep
✅ **Level Qualification System** - Unlock levels by getting direct referrals
✅ **2× ROI Cap** - Investments return exactly 200% over time
✅ **Direct Sponsor Bonus** - 5% instant commission on referral investments
✅ **Income Transaction Tracking** - Full audit trail of all income
✅ **Dashboard Income Cards** - Visual display of all income streams
✅ **Updated Commission Rates** - New percentages (15%, 12%, 10%, etc.)

---

## 🔧 Troubleshooting

**Issue:** New income columns not showing in dashboard
- **Solution:** Run the SQL migration to add columns to `wallets` table

**Issue:** Direct referral commission not crediting
- **Solution:** Verify the trigger is created: `trigger_direct_referral_commission`

**Issue:** Level income not being paid
- **Solution:** Check `user_level_qualifications` table to ensure user is qualified

**Issue:** ROI not stopping at 2×
- **Solution:** Verify `total_roi_cap` is set on all investments (should be `amount * 2`)

---

## 📞 Support

If you encounter any issues during implementation, check:
1. Cloud Console SQL Editor for error messages
2. Edge Function logs for runtime errors
3. Browser console for frontend errors

The system is now ready to process the new income structure once the database migration is complete!
