-- Allow users to view basic profile info of users in their referral network
-- This is needed for the referrals page to display referred user names

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create a new policy that allows users to see their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a policy to allow viewing basic info of referred users
CREATE POLICY "Users can view referred users basic info"
ON profiles
FOR SELECT
USING (
  id IN (
    SELECT referred_user_id 
    FROM referrals 
    WHERE user_id = auth.uid()
  )
);