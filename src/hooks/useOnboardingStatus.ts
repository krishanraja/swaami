import { useMemo } from "react";
import { Profile } from "./useProfile";

/**
 * Single source of truth for onboarding completion status.
 * 
 * A user is considered "onboarded" when they have:
 * - Phone number (mandatory - indicates phone verification step completed)
 * - City (required for location-based matching)
 * - Neighbourhood (required for location-based matching)
 * - At least one skill (required for helping others)
 * 
 * This logic is used consistently across:
 * - Index.tsx (to determine if user needs onboarding)
 * - Join.tsx (to determine if user should skip onboarding)
 * - Landing.tsx (to show appropriate CTA)
 */
export function useOnboardingStatus(profile: Profile | null | undefined) {
  const isOnboarded = useMemo(() => {
    if (!profile) return false;
    
    // Phone is the key gate - if they don't have a phone, they never completed
    // the mandatory phone verification step in the onboarding flow
    if (!profile.phone) return false;
    
    // All other required fields must be present
    if (!profile.city) return false;
    if (!profile.neighbourhood) return false;
    if (!profile.skills || profile.skills.length === 0) return false;
    
    return true;
  }, [profile]);

  const missingFields = useMemo(() => {
    if (!profile) return ['phone', 'city', 'neighbourhood', 'skills'];
    
    const missing: string[] = [];
    if (!profile.phone) missing.push('phone');
    if (!profile.city) missing.push('city');
    if (!profile.neighbourhood) missing.push('neighbourhood');
    if (!profile.skills || profile.skills.length === 0) missing.push('skills');
    
    return missing;
  }, [profile]);

  return {
    isOnboarded,
    missingFields,
    hasPhone: !!profile?.phone,
    hasLocation: !!(profile?.city && profile?.neighbourhood),
    hasSkills: !!(profile?.skills && profile.skills.length > 0),
  };
}

