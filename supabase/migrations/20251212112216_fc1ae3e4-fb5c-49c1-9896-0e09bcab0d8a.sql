-- Drop and recreate get_public_tasks with owner photo URL
DROP FUNCTION IF EXISTS public.get_public_tasks();

CREATE FUNCTION public.get_public_tasks()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  original_description text,
  status text,
  time_estimate text,
  urgency text,
  category text,
  approx_address text,
  created_at timestamptz,
  updated_at timestamptz,
  owner_id uuid,
  owner_display_name text,
  owner_trust_tier trust_tier,
  owner_reliability_score numeric,
  owner_is_demo boolean,
  owner_photo_url text
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
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
    (SELECT photo_url FROM user_photos up WHERE up.user_id = p.user_id AND up.photo_type = 'profile' LIMIT 1) as owner_photo_url
  FROM tasks t
  JOIN profiles p ON t.owner_id = p.id
  WHERE t.status = 'open'
  ORDER BY t.created_at DESC;
$$;