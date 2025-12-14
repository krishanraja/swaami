-- Fix matches RLS policy to be more robust
-- The issue is that the helper_id check might fail if profiles aren't properly linked

-- First, let's recreate the helper function to be more robust
CREATE OR REPLACE FUNCTION public.get_user_profile_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Drop and recreate the matches INSERT policy to be more permissive but still secure
DROP POLICY IF EXISTS "Users can create matches" ON matches;

-- Allow users to create matches where they are the helper
-- The check verifies the helper_id matches the authenticated user's profile
CREATE POLICY "Users can create matches" ON matches
FOR INSERT WITH CHECK (
  -- The helper_id must belong to a profile owned by the current user
  helper_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Also ensure the SELECT policy allows viewing matches properly
DROP POLICY IF EXISTS "Users can view their matches" ON matches;

CREATE POLICY "Users can view their matches" ON matches
FOR SELECT USING (
  -- User is the helper
  helper_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  -- User owns the task
  task_id IN (
    SELECT t.id FROM tasks t 
    INNER JOIN profiles p ON t.owner_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- Ensure update policy is also robust
DROP POLICY IF EXISTS "Participants can update matches" ON matches;

CREATE POLICY "Participants can update matches" ON matches
FOR UPDATE USING (
  -- User is the helper
  helper_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  -- User owns the task
  task_id IN (
    SELECT t.id FROM tasks t 
    INNER JOIN profiles p ON t.owner_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- Add a constraint to prevent helping with demo/sample tasks at the database level
-- This is a backup to the application-level check
CREATE OR REPLACE FUNCTION public.check_not_demo_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_owner_is_demo boolean;
BEGIN
  -- Check if the task owner is a demo user
  SELECT p.is_demo INTO task_owner_is_demo
  FROM tasks t
  INNER JOIN profiles p ON t.owner_id = p.id
  WHERE t.id = NEW.task_id;
  
  -- If the owner is a demo user, reject the match
  IF task_owner_is_demo = true THEN
    RAISE EXCEPTION 'Cannot create matches for demo/sample tasks';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to prevent demo task matches
DROP TRIGGER IF EXISTS prevent_demo_task_matches ON matches;
CREATE TRIGGER prevent_demo_task_matches
  BEFORE INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION public.check_not_demo_task();
