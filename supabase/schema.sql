-- ============================================================================
-- SWAAMI DATABASE SCHEMA
-- Consolidated schema for fresh Supabase project setup
-- ============================================================================
-- This file contains all tables, policies, functions, triggers, and storage
-- configuration needed for the Swaami application.
-- Run this on a fresh Supabase project to set up the complete database.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Trust tier enum
DO $$ BEGIN
  CREATE TYPE public.trust_tier AS ENUM ('tier_0', 'tier_1', 'tier_2');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Verification type enum
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Subscription status enum
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('free', 'active', 'cancelled', 'past_due');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  city TEXT CHECK (city IN ('sydney', 'new_york')),
  neighbourhood TEXT,
  radius INTEGER DEFAULT 500,
  skills TEXT[] DEFAULT '{}',
  availability TEXT DEFAULT 'now' CHECK (availability IN ('now', 'later', 'this-week')),
  credits INTEGER DEFAULT 5,
  tasks_completed INTEGER DEFAULT 0,
  reliability_score NUMERIC(3,2) DEFAULT 5.00,
  trust_tier public.trust_tier DEFAULT 'tier_0',
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  helper_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  original_description TEXT,
  time_estimate TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('urgent', 'normal', 'flexible')),
  category TEXT,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  approx_address TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in-progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  helper_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'arrived', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, helper_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TRUST & VERIFICATION TABLES
-- ============================================================================

-- User verifications table
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type public.verification_type NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, verification_type)
);

-- User photos table
CREATE TABLE IF NOT EXISTS public.user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('profile', 'casual', 'context')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, photo_type)
);

-- Social connections table
CREATE TABLE IF NOT EXISTS public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple')),
  provider_id TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Endorsements table
CREATE TABLE IF NOT EXISTS public.endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorsed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- ============================================================================
-- SUBSCRIPTION TABLES
-- ============================================================================

-- User subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status subscription_status NOT NULL DEFAULT 'free',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  posts_used_this_month INTEGER NOT NULL DEFAULT 0,
  posts_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================================
-- OTP & UTILITY TABLES
-- ============================================================================

-- OTP verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'sms',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Neighbourhoods lookup table
CREATE TABLE IF NOT EXISTS public.neighbourhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL CHECK (city IN ('sydney', 'new_york')),
  name text NOT NULL,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(city, name)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON public.otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_user_photos_profile_id ON public.user_photos(profile_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighbourhoods ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - TASKS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view open tasks" ON public.tasks;
CREATE POLICY "Anyone can view open tasks" 
ON public.tasks FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
CREATE POLICY "Users can create tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can update own tasks" ON public.tasks;
CREATE POLICY "Owners can update own tasks" 
ON public.tasks FOR UPDATE 
USING (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can delete own tasks" ON public.tasks;
CREATE POLICY "Owners can delete own tasks" 
ON public.tasks FOR DELETE 
USING (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- RLS POLICIES - MATCHES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their matches" ON public.matches;
CREATE POLICY "Users can view their matches" 
ON public.matches FOR SELECT 
USING (
  helper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  task_id IN (SELECT id FROM public.tasks WHERE owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can create matches" ON public.matches;
CREATE POLICY "Users can create matches" 
ON public.matches FOR INSERT 
WITH CHECK (helper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Participants can update matches" ON public.matches;
CREATE POLICY "Participants can update matches" 
ON public.matches FOR UPDATE 
USING (
  helper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  task_id IN (SELECT id FROM public.tasks WHERE owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

-- ============================================================================
-- RLS POLICIES - MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "Match participants can view messages" ON public.messages;
CREATE POLICY "Match participants can view messages" 
ON public.messages FOR SELECT 
USING (
  match_id IN (SELECT id FROM public.matches WHERE 
    helper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    task_id IN (SELECT id FROM public.tasks WHERE owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Match participants can send messages" ON public.messages;
CREATE POLICY "Match participants can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND
  match_id IN (SELECT id FROM public.matches WHERE 
    helper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    task_id IN (SELECT id FROM public.tasks WHERE owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  )
);

-- ============================================================================
-- RLS POLICIES - USER VERIFICATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own verifications" ON public.user_verifications;
CREATE POLICY "Users can view own verifications"
ON public.user_verifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own verifications" ON public.user_verifications;
CREATE POLICY "Users can insert own verifications"
ON public.user_verifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - USER PHOTOS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all photos" ON public.user_photos;
CREATE POLICY "Users can view all photos"
ON public.user_photos FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can manage own photos" ON public.user_photos;
CREATE POLICY "Users can manage own photos"
ON public.user_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own photos" ON public.user_photos;
CREATE POLICY "Users can update own photos"
ON public.user_photos FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own photos" ON public.user_photos;
CREATE POLICY "Users can delete own photos"
ON public.user_photos FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage photos by profile_id" ON public.user_photos;
CREATE POLICY "Users can manage photos by profile_id" 
ON public.user_photos 
FOR ALL
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR auth.uid() = user_id
)
WITH CHECK (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR auth.uid() = user_id
);

-- ============================================================================
-- RLS POLICIES - SOCIAL CONNECTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own social connections" ON public.social_connections;
CREATE POLICY "Users can view own social connections"
ON public.social_connections FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own social connections" ON public.social_connections;
CREATE POLICY "Users can manage own social connections"
ON public.social_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - ENDORSEMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view endorsements they're involved in" ON public.endorsements;
CREATE POLICY "Users can view endorsements they're involved in"
ON public.endorsements FOR SELECT
USING (auth.uid() = endorser_id OR auth.uid() = endorsed_id);

DROP POLICY IF EXISTS "Tier 1+ users can create endorsements" ON public.endorsements;
CREATE POLICY "Tier 1+ users can create endorsements"
ON public.endorsements FOR INSERT
WITH CHECK (
  auth.uid() = endorser_id AND
  (SELECT trust_tier FROM public.profiles WHERE user_id = auth.uid()) IN ('tier_1', 'tier_2') AND
  (SELECT COUNT(*) FROM public.endorsements WHERE endorser_id = auth.uid() AND status = 'accepted') < 5
);

DROP POLICY IF EXISTS "Endorsers can update own endorsements" ON public.endorsements;
CREATE POLICY "Endorsers can update own endorsements"
ON public.endorsements FOR UPDATE
USING (auth.uid() = endorser_id);

-- ============================================================================
-- RLS POLICIES - USER SUBSCRIPTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert own subscription"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - NEIGHBOURHOODS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view neighbourhoods" ON public.neighbourhoods;
CREATE POLICY "Anyone can view neighbourhoods" 
ON public.neighbourhoods 
FOR SELECT 
USING (true);

-- ============================================================================
-- FUNCTIONS - UTILITY
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- FUNCTIONS - USER MANAGEMENT
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function to handle new user subscription creation
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- FUNCTIONS - TRUST TIER
-- ============================================================================

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

-- Trigger function to recalculate trust tier on verification changes
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

-- ============================================================================
-- FUNCTIONS - TASKS
-- ============================================================================

-- Function to atomically create match and update task
CREATE OR REPLACE FUNCTION help_with_task(
  p_task_id UUID,
  p_helper_id UUID
) RETURNS TABLE(match_id UUID) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id UUID;
  v_task_status TEXT;
BEGIN
  -- Check if task exists and is still open
  SELECT status INTO v_task_status
  FROM tasks
  WHERE id = p_task_id
  FOR UPDATE; -- Lock the row for update

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task_status != 'open' THEN
    RAISE EXCEPTION 'Task is no longer available (status: %)', v_task_status;
  END IF;

  -- Check if there's already an active match for this task
  IF EXISTS (
    SELECT 1 FROM matches 
    WHERE task_id = p_task_id 
    AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Task is already matched to another helper';
  END IF;

  -- Create match
  INSERT INTO matches (task_id, helper_id, status)
  VALUES (p_task_id, p_helper_id, 'accepted')
  RETURNING id INTO v_match_id;

  -- Update task status (atomic within transaction)
  UPDATE tasks 
  SET status = 'matched', helper_id = p_helper_id, updated_at = now()
  WHERE id = p_task_id;

  RETURN QUERY SELECT v_match_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION help_with_task(UUID, UUID) TO authenticated;

-- Function to get public tasks
CREATE OR REPLACE FUNCTION public.get_public_tasks()
RETURNS TABLE(
  id uuid, 
  title text, 
  description text, 
  original_description text, 
  status text, 
  time_estimate text, 
  urgency text, 
  category text, 
  approx_address text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  owner_id uuid, 
  owner_display_name text, 
  owner_trust_tier trust_tier, 
  owner_reliability_score numeric, 
  owner_is_demo boolean, 
  owner_photo_url text,
  owner_skills text[],
  owner_member_since timestamp with time zone,
  owner_tasks_completed integer,
  owner_neighbourhood text
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT 
    t.id,
    t.title,
    t.description,
    t.original_description,
    t.status,
    t.time_estimate,
    t.urgency,
    t.category,
    t.approx_address,
    t.created_at,
    t.updated_at,
    t.owner_id,
    p.display_name as owner_display_name,
    p.trust_tier as owner_trust_tier,
    p.reliability_score as owner_reliability_score,
    p.is_demo as owner_is_demo,
    (SELECT photo_url FROM user_photos up WHERE (up.profile_id = p.id OR up.user_id = p.user_id) AND up.photo_type = 'profile' LIMIT 1) as owner_photo_url,
    p.skills as owner_skills,
    p.created_at as owner_member_since,
    p.tasks_completed as owner_tasks_completed,
    p.neighbourhood as owner_neighbourhood
  FROM tasks t
  JOIN profiles p ON t.owner_id = p.id
  WHERE t.status = 'open'
  ORDER BY t.created_at DESC;
$function$;

-- Function to get nearby tasks with distance calculation
CREATE OR REPLACE FUNCTION public.get_nearby_tasks(user_lat numeric, user_lng numeric, radius_km numeric DEFAULT 1)
RETURNS TABLE(
  id uuid, 
  title text, 
  description text, 
  original_description text, 
  status text, 
  time_estimate text, 
  urgency text, 
  category text, 
  approx_address text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  owner_id uuid, 
  owner_display_name text, 
  owner_trust_tier trust_tier, 
  owner_reliability_score numeric, 
  owner_is_demo boolean, 
  owner_photo_url text,
  owner_skills text[],
  owner_member_since timestamp with time zone,
  owner_tasks_completed integer,
  owner_neighbourhood text,
  distance_km numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    t.id,
    t.title,
    t.description,
    t.original_description,
    t.status,
    t.time_estimate,
    t.urgency,
    t.category,
    t.approx_address,
    t.created_at,
    t.updated_at,
    t.owner_id,
    p.display_name as owner_display_name,
    p.trust_tier as owner_trust_tier,
    p.reliability_score as owner_reliability_score,
    p.is_demo as owner_is_demo,
    (SELECT photo_url FROM user_photos up WHERE (up.profile_id = p.id OR up.user_id = p.user_id) AND up.photo_type = 'profile' LIMIT 1) as owner_photo_url,
    p.skills as owner_skills,
    p.created_at as owner_member_since,
    p.tasks_completed as owner_tasks_completed,
    p.neighbourhood as owner_neighbourhood,
    CASE 
      WHEN t.location_lat IS NOT NULL AND t.location_lng IS NOT NULL THEN
        6371 * acos(
          cos(radians(user_lat)) * cos(radians(t.location_lat)) * 
          cos(radians(t.location_lng) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(t.location_lat))
        )
      ELSE NULL
    END as distance_km
  FROM tasks t
  JOIN profiles p ON t.owner_id = p.id
  WHERE t.status = 'open'
    AND (
      t.location_lat IS NULL 
      OR t.location_lng IS NULL
      OR (
        6371 * acos(
          cos(radians(user_lat)) * cos(radians(t.location_lat)) * 
          cos(radians(t.location_lng) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(t.location_lat))
        ) <= radius_km
      )
    )
  ORDER BY 
    CASE WHEN t.location_lat IS NULL THEN 1 ELSE 0 END,
    distance_km ASC NULLS LAST,
    t.created_at DESC;
$function$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for new user signup (creates profile)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for new user subscription creation
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Trigger to recalculate trust tier on verification changes
DROP TRIGGER IF EXISTS on_verification_change ON public.user_verifications;
CREATE TRIGGER on_verification_change
AFTER INSERT OR UPDATE ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_trust_tier();

-- Timestamp triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON public.tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at 
  BEFORE UPDATE ON public.matches 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- REALTIME
-- ============================================================================

-- Enable realtime for tasks, messages, and matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create profile-photos bucket (idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Storage policies for profile-photos bucket
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Seed Sydney neighbourhoods
INSERT INTO public.neighbourhoods (city, name, latitude, longitude) VALUES
  ('sydney', 'Surry Hills', -33.8856, 151.2115),
  ('sydney', 'Newtown', -33.8975, 151.1790),
  ('sydney', 'Bondi', -33.8914, 151.2743),
  ('sydney', 'Paddington', -33.8840, 151.2266),
  ('sydney', 'Glebe', -33.8791, 151.1871),
  ('sydney', 'Marrickville', -33.9111, 151.1547),
  ('sydney', 'Redfern', -33.8928, 151.2027),
  ('sydney', 'Darlinghurst', -33.8774, 151.2167),
  ('sydney', 'Balmain', -33.8578, 151.1800),
  ('sydney', 'Manly', -33.7969, 151.2847),
  ('sydney', 'Mosman', -33.8295, 151.2440),
  ('sydney', 'Neutral Bay', -33.8347, 151.2203)
ON CONFLICT (city, name) DO NOTHING;

-- Seed New York neighbourhoods
INSERT INTO public.neighbourhoods (city, name, latitude, longitude) VALUES
  ('new_york', 'SoHo', 40.7233, -74.0030),
  ('new_york', 'Tribeca', 40.7163, -74.0086),
  ('new_york', 'Greenwich Village', 40.7336, -74.0027),
  ('new_york', 'Chelsea', 40.7465, -74.0014),
  ('new_york', 'Williamsburg', 40.7081, -73.9571),
  ('new_york', 'Park Slope', 40.6710, -73.9814),
  ('new_york', 'DUMBO', 40.7033, -73.9883),
  ('new_york', 'Astoria', 40.7720, -73.9301),
  ('new_york', 'Long Island City', 40.7447, -73.9485),
  ('new_york', 'Upper West Side', 40.7870, -73.9754),
  ('new_york', 'Upper East Side', 40.7736, -73.9566),
  ('new_york', 'Harlem', 40.8116, -73.9465)
ON CONFLICT (city, name) DO NOTHING;

-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================
-- The database is now ready for use with the Swaami application.
-- All tables, policies, functions, triggers, and storage buckets are configured.
-- ============================================================================

