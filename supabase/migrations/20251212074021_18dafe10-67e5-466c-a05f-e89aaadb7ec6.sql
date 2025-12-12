-- Create OTP verifications table for persistent storage
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'sms',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast lookups by phone
CREATE INDEX idx_otp_verifications_phone ON public.otp_verifications(phone);

-- Enable RLS but allow edge function access via service role
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access this table
-- This is intentional for security