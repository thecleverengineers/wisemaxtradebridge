-- Add KYC fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_pan_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_aadhar_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_usdt_wallet TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_approved_at TIMESTAMP WITH TIME ZONE;