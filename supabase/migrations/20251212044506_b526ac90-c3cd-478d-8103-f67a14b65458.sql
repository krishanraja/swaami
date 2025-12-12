-- Fix 1: Profiles - Hide phone numbers from other users
-- Drop existing permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a policy that only allows viewing own full profile
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Create a security definer function to get public profile info (without phone)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_profile_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  city text,
  neighbourhood text,
  skills text[],
  availability text,
  radius integer,
  credits integer,
  tasks_completed integer,
  reliability_score numeric,
  trust_tier trust_tier,
  created_at timestamptz,
  is_demo boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, p.user_id, p.display_name, p.city, p.neighbourhood,
    p.skills, p.availability, p.radius, p.credits, p.tasks_completed,
    p.reliability_score, p.trust_tier, p.created_at, p.is_demo
  FROM profiles p
  WHERE p.id = p_profile_id;
$$;

-- Create a function to get all public profiles (for feed, etc.)
CREATE OR REPLACE FUNCTION public.get_all_public_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  city text,
  neighbourhood text,
  skills text[],
  availability text,
  radius integer,
  credits integer,
  tasks_completed integer,
  reliability_score numeric,
  trust_tier trust_tier,
  created_at timestamptz,
  is_demo boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, p.user_id, p.display_name, p.city, p.neighbourhood,
    p.skills, p.availability, p.radius, p.credits, p.tasks_completed,
    p.reliability_score, p.trust_tier, p.created_at, p.is_demo
  FROM profiles p;
$$;

-- Fix 2: Tasks - Hide precise coordinates from non-owners
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Anyone can view open tasks" ON public.tasks;

-- Create policy for owners to see their own tasks fully
CREATE POLICY "Owners can view own tasks"
ON public.tasks
FOR SELECT
USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create policy for helpers matched to a task
CREATE POLICY "Helpers can view matched tasks"
ON public.tasks
FOR SELECT
USING (
  id IN (
    SELECT task_id FROM matches 
    WHERE helper_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Create a security definer function to get tasks with hidden precise location
CREATE OR REPLACE FUNCTION public.get_public_tasks()
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  title text,
  description text,
  original_description text,
  category text,
  time_estimate text,
  urgency text,
  approx_address text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  -- Include owner profile info (safe fields only)
  owner_display_name text,
  owner_trust_tier trust_tier,
  owner_reliability_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id, t.owner_id, t.title, t.description, t.original_description,
    t.category, t.time_estimate, t.urgency, t.approx_address, t.status,
    t.created_at, t.updated_at,
    p.display_name as owner_display_name,
    p.trust_tier as owner_trust_tier,
    p.reliability_score as owner_reliability_score
  FROM tasks t
  LEFT JOIN profiles p ON t.owner_id = p.id
  WHERE t.status = 'open';
$$;

-- Function to get a specific task with full details only if authorized
CREATE OR REPLACE FUNCTION public.get_task_with_location(p_task_id uuid)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  title text,
  description text,
  category text,
  time_estimate text,
  urgency text,
  approx_address text,
  location_lat numeric,
  location_lng numeric,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_profile_id uuid;
  v_is_owner boolean;
  v_is_helper boolean;
BEGIN
  -- Get current user's profile id
  SELECT id INTO v_user_profile_id FROM profiles WHERE user_id = auth.uid();
  
  -- Check if user is owner
  SELECT EXISTS(SELECT 1 FROM tasks WHERE tasks.id = p_task_id AND tasks.owner_id = v_user_profile_id) INTO v_is_owner;
  
  -- Check if user is a matched helper
  SELECT EXISTS(SELECT 1 FROM matches WHERE matches.task_id = p_task_id AND matches.helper_id = v_user_profile_id) INTO v_is_helper;
  
  -- Return task with or without precise location based on authorization
  IF v_is_owner OR v_is_helper THEN
    RETURN QUERY
    SELECT t.id, t.owner_id, t.title, t.description, t.category, t.time_estimate,
           t.urgency, t.approx_address, t.location_lat, t.location_lng, t.status, t.created_at
    FROM tasks t WHERE t.id = p_task_id;
  ELSE
    -- Return without precise coordinates
    RETURN QUERY
    SELECT t.id, t.owner_id, t.title, t.description, t.category, t.time_estimate,
           t.urgency, t.approx_address, NULL::numeric, NULL::numeric, t.status, t.created_at
    FROM tasks t WHERE t.id = p_task_id AND t.status = 'open';
  END IF;
END;
$$;