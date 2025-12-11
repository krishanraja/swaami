-- Add city and neighbourhood columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city text CHECK (city IN ('sydney', 'new_york')),
ADD COLUMN IF NOT EXISTS neighbourhood text;

-- Create neighbourhoods lookup table
CREATE TABLE IF NOT EXISTS public.neighbourhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL CHECK (city IN ('sydney', 'new_york')),
  name text NOT NULL,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(city, name)
);

-- Enable RLS
ALTER TABLE public.neighbourhoods ENABLE ROW LEVEL SECURITY;

-- Everyone can read neighbourhoods
CREATE POLICY "Anyone can view neighbourhoods" 
ON public.neighbourhoods 
FOR SELECT 
USING (true);

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