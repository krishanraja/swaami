-- Migration: Allow NULL user_id for demo profiles
-- This enables the seed-demo-users edge function to create demo profiles
-- without requiring actual auth.users entries

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Step 2: Alter the column to allow NULL values
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Re-add the foreign key constraint (now allows NULL)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Update the unique constraint to allow multiple NULLs
-- PostgreSQL UNIQUE constraints already allow multiple NULLs by default
-- But we need to drop and recreate to ensure it's correct
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Create a partial unique index that only applies to non-NULL values
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique 
ON public.profiles (user_id) 
WHERE user_id IS NOT NULL;

-- Step 5: Update RLS policies to handle NULL user_id for demo profiles
-- Demo profiles (user_id IS NULL) should be viewable by everyone
-- but not editable by anyone except service role

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (
  -- Regular users can update their own profile
  (user_id IS NOT NULL AND auth.uid() = user_id)
  -- Demo profiles cannot be updated via RLS (only service role)
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (
  -- Regular users can insert their own profile
  (user_id IS NOT NULL AND auth.uid() = user_id)
  -- Demo profiles are inserted via service role (bypasses RLS)
);

-- Ensure demo profiles are viewable (already covered by "Users can view all profiles")
-- No changes needed for SELECT policy
