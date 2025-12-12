-- Trust tier enum
CREATE TYPE public.trust_tier AS ENUM ('tier_0', 'tier_1', 'tier_2');

-- Verification type enum
CREATE TYPE public.verification_type AS ENUM (
  'email', 
  'phone_sms', 
  'phone_whatsapp', 
  'social_google', 
  'social_apple', 
  'photos_complete', 
  'endorsement', 
  'mfa_enabled'
);

-- Add trust_tier to profiles
ALTER TABLE public.profiles 
ADD COLUMN trust_tier public.trust_tier DEFAULT 'tier_0';

-- User verifications table
CREATE TABLE public.user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type public.verification_type NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, verification_type)
);

ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications"
ON public.user_verifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications"
ON public.user_verifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User photos table
CREATE TABLE public.user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('profile', 'casual', 'context')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, photo_type)
);

ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all photos"
ON public.user_photos FOR SELECT
USING (true);

CREATE POLICY "Users can manage own photos"
ON public.user_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
ON public.user_photos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
ON public.user_photos FOR DELETE
USING (auth.uid() = user_id);

-- Social connections table
CREATE TABLE public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple')),
  provider_id TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own social connections"
ON public.social_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own social connections"
ON public.social_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Endorsements table
CREATE TABLE public.endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorsed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view endorsements they're involved in"
ON public.endorsements FOR SELECT
USING (auth.uid() = endorser_id OR auth.uid() = endorsed_id);

CREATE POLICY "Tier 1+ users can create endorsements"
ON public.endorsements FOR INSERT
WITH CHECK (
  auth.uid() = endorser_id AND
  (SELECT trust_tier FROM public.profiles WHERE user_id = auth.uid()) IN ('tier_1', 'tier_2') AND
  (SELECT COUNT(*) FROM public.endorsements WHERE endorser_id = auth.uid() AND status = 'accepted') < 5
);

CREATE POLICY "Endorsers can update own endorsements"
ON public.endorsements FOR UPDATE
USING (auth.uid() = endorser_id);

-- Function to calculate and update trust tier
CREATE OR REPLACE FUNCTION public.calculate_trust_tier(p_user_id UUID)
RETURNS public.trust_tier
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_verified BOOLEAN;
  v_phone_verified BOOLEAN;
  v_social_connected BOOLEAN;
  v_photos_complete BOOLEAN;
  v_has_endorsement BOOLEAN;
  v_mfa_enabled BOOLEAN;
  v_new_tier public.trust_tier;
BEGIN
  -- Check verifications
  SELECT EXISTS(SELECT 1 FROM user_verifications WHERE user_id = p_user_id AND verification_type = 'email') INTO v_email_verified;
  SELECT EXISTS(SELECT 1 FROM user_verifications WHERE user_id = p_user_id AND verification_type IN ('phone_sms', 'phone_whatsapp')) INTO v_phone_verified;
  SELECT EXISTS(SELECT 1 FROM user_verifications WHERE user_id = p_user_id AND verification_type IN ('social_google', 'social_apple')) INTO v_social_connected;
  SELECT EXISTS(SELECT 1 FROM user_verifications WHERE user_id = p_user_id AND verification_type = 'photos_complete') INTO v_photos_complete;
  SELECT EXISTS(SELECT 1 FROM user_verifications WHERE user_id = p_user_id AND verification_type = 'endorsement') INTO v_has_endorsement;
  SELECT EXISTS(SELECT 1 FROM user_verifications WHERE user_id = p_user_id AND verification_type = 'mfa_enabled') INTO v_mfa_enabled;

  -- Tier 2: All verifications complete
  IF v_email_verified AND v_phone_verified AND v_social_connected AND v_photos_complete AND v_has_endorsement AND v_mfa_enabled THEN
    v_new_tier := 'tier_2';
  -- Tier 1: Email + Phone + Social verified
  ELSIF v_email_verified AND v_phone_verified AND v_social_connected THEN
    v_new_tier := 'tier_1';
  -- Tier 0: Default
  ELSE
    v_new_tier := 'tier_0';
  END IF;

  -- Update profile
  UPDATE profiles SET trust_tier = v_new_tier WHERE user_id = p_user_id;
  
  RETURN v_new_tier;
END;
$$;

-- Trigger to recalculate trust tier on verification changes
CREATE OR REPLACE FUNCTION public.trigger_recalculate_trust_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM calculate_trust_tier(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_verification_change
AFTER INSERT OR UPDATE ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_trust_tier();

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);