
-- Create function to auto-grant admin access for specific email
CREATE OR REPLACE FUNCTION public.auto_grant_admin_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'hello@krishraja.com' THEN
    -- Update their profile to Tier 2 with full access
    UPDATE profiles 
    SET trust_tier = 'tier_2',
        phone = '+61429618105',
        credits = 100,
        tasks_completed = 25,
        reliability_score = 5.0,
        city = 'sydney',
        neighbourhood = 'Surry Hills',
        skills = ARRAY['Tech', 'Strategy', 'Leadership']
    WHERE user_id = NEW.id;
    
    -- Add all verifications
    INSERT INTO user_verifications (user_id, verification_type, metadata)
    VALUES 
      (NEW.id, 'email', '{"email": "hello@krishraja.com", "auto": true}'::jsonb),
      (NEW.id, 'phone_sms', '{"phone": "+61429618105", "auto": true}'::jsonb),
      (NEW.id, 'social_google', '{"provider": "google", "auto": true}'::jsonb),
      (NEW.id, 'photos_complete', '{"auto": true}'::jsonb),
      (NEW.id, 'endorsement', '{"auto": true}'::jsonb),
      (NEW.id, 'mfa_enabled', '{"auto": true}'::jsonb)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_grant_admin_access();
