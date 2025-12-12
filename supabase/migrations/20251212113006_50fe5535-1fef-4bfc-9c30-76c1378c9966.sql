-- Fix search_path for get_nearby_tasks
DROP FUNCTION IF EXISTS public.get_nearby_tasks(numeric, numeric, numeric);

CREATE FUNCTION public.get_nearby_tasks(
  user_lat numeric,
  user_lng numeric,
  radius_km numeric DEFAULT 1
)
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
  owner_photo_url text,
  distance_km numeric
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
    (SELECT photo_url FROM user_photos up WHERE up.user_id = p.user_id AND up.photo_type = 'profile' LIMIT 1) as owner_photo_url,
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
$$;