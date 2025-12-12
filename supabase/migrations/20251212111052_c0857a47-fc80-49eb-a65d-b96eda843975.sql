-- Drop and recreate get_public_tasks to include is_demo field from profiles
DROP FUNCTION IF EXISTS public.get_public_tasks();

CREATE FUNCTION public.get_public_tasks()
RETURNS TABLE(
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
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  owner_display_name text, 
  owner_trust_tier trust_tier, 
  owner_reliability_score numeric,
  owner_is_demo boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    t.id, t.owner_id, t.title, t.description, t.original_description,
    t.category, t.time_estimate, t.urgency, t.approx_address, t.status,
    t.created_at, t.updated_at,
    p.display_name as owner_display_name,
    p.trust_tier as owner_trust_tier,
    p.reliability_score as owner_reliability_score,
    COALESCE(p.is_demo, false) as owner_is_demo
  FROM tasks t
  LEFT JOIN profiles p ON t.owner_id = p.id
  WHERE t.status = 'open';
$function$;