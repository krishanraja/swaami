-- First, drop the foreign key constraint temporarily
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Make user_id nullable
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Re-add the foreign key with ON DELETE CASCADE, allowing NULL values
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add is_demo column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Insert 6 demo profiles with NULL user_id (since they're demo accounts)
INSERT INTO public.profiles (id, user_id, display_name, phone, skills, availability, radius, credits, tasks_completed, reliability_score, is_demo)
VALUES 
  (gen_random_uuid(), NULL, 'Sarah Chen', '+61400111222', ARRAY['gardening', 'cooking', 'pet-care'], 'this-week', 750, 12, 8, 4.8, true),
  (gen_random_uuid(), NULL, 'Marcus Johnson', '+61400222333', ARRAY['handyman', 'tech-help', 'moving'], 'later', 500, 25, 15, 4.9, true),
  (gen_random_uuid(), NULL, 'Priya Sharma', '+61400333444', ARRAY['tutoring', 'languages', 'cooking'], 'now', 1000, 8, 5, 4.7, true),
  (gen_random_uuid(), NULL, 'Tom Wilson', '+61400444555', ARRAY['driving', 'shopping', 'yard-work'], 'now', 2000, 30, 22, 5.0, true),
  (gen_random_uuid(), NULL, 'Emma Rodriguez', '+61400555666', ARRAY['childcare', 'cleaning', 'cooking'], 'this-week', 300, 15, 10, 4.6, true),
  (gen_random_uuid(), NULL, 'David Kim', '+61400666777', ARRAY['tech-help', 'appliances', 'assembly'], 'later', 800, 20, 12, 4.8, true);