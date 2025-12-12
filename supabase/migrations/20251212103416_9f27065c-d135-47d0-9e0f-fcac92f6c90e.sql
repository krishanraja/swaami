-- Part 1: Create SECURITY DEFINER helper functions to avoid RLS recursion

-- Function to get task IDs owned by a user (without triggering RLS)
CREATE OR REPLACE FUNCTION public.get_user_profile_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Function to check if user owns a task
CREATE OR REPLACE FUNCTION public.user_owns_task(task_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tasks t
    INNER JOIN profiles p ON t.owner_id = p.id
    WHERE t.id = task_uuid AND p.user_id = user_uuid
  );
$$;

-- Function to check if user is helper on a match for a task
CREATE OR REPLACE FUNCTION public.user_is_helper_on_task(task_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM matches m
    INNER JOIN profiles p ON m.helper_id = p.id
    WHERE m.task_id = task_uuid AND p.user_id = user_uuid
  );
$$;

-- Function to check if user is helper on a match
CREATE OR REPLACE FUNCTION public.user_is_match_helper(match_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM matches m
    INNER JOIN profiles p ON m.helper_id = p.id
    WHERE m.id = match_uuid AND p.user_id = user_uuid
  );
$$;

-- Function to check if user owns the task associated with a match
CREATE OR REPLACE FUNCTION public.user_owns_match_task(match_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM matches m
    INNER JOIN tasks t ON m.task_id = t.id
    INNER JOIN profiles p ON t.owner_id = p.id
    WHERE m.id = match_uuid AND p.user_id = user_uuid
  );
$$;

-- Part 2: Drop and recreate RLS policies on tasks table

DROP POLICY IF EXISTS "Helpers can view matched tasks" ON tasks;
DROP POLICY IF EXISTS "Owners can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Owners can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Owners can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;

-- Recreate tasks policies using SECURITY DEFINER functions
CREATE POLICY "Owners can view own tasks" ON tasks
FOR SELECT USING (
  owner_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Helpers can view matched tasks" ON tasks
FOR SELECT USING (
  public.user_is_helper_on_task(id, auth.uid())
);

CREATE POLICY "Users can create tasks" ON tasks
FOR INSERT WITH CHECK (
  owner_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Owners can update own tasks" ON tasks
FOR UPDATE USING (
  owner_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Owners can delete own tasks" ON tasks
FOR DELETE USING (
  owner_id = public.get_user_profile_id(auth.uid())
);

-- Part 3: Drop and recreate RLS policies on matches table

DROP POLICY IF EXISTS "Participants can update matches" ON matches;
DROP POLICY IF EXISTS "Users can create matches" ON matches;
DROP POLICY IF EXISTS "Users can view their matches" ON matches;

-- Recreate matches policies using SECURITY DEFINER functions
CREATE POLICY "Users can view their matches" ON matches
FOR SELECT USING (
  public.user_is_match_helper(id, auth.uid()) OR 
  public.user_owns_match_task(id, auth.uid())
);

CREATE POLICY "Users can create matches" ON matches
FOR INSERT WITH CHECK (
  helper_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Participants can update matches" ON matches
FOR UPDATE USING (
  public.user_is_match_helper(id, auth.uid()) OR 
  public.user_owns_match_task(id, auth.uid())
);

-- Part 4: Add new enhanced task fields

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS availability_time text DEFAULT 'Flexible';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS physical_level text DEFAULT 'light';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS people_needed integer DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS access_instructions text;