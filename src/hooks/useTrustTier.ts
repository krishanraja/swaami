import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type TrustTier = 'tier_0' | 'tier_1' | 'tier_2';
export type VerificationType = 
  | 'email' 
  | 'phone_sms' 
  | 'phone_whatsapp' 
  | 'social_google' 
  | 'social_apple' 
  | 'photos_complete' 
  | 'endorsement' 
  | 'mfa_enabled';

export interface Verification {
  id: string;
  verification_type: VerificationType;
  verified_at: string;
  metadata: unknown;
}

export interface TrustTierState {
  tier: TrustTier;
  verifications: Verification[];
  loading: boolean;
  canBrowse: boolean;      // Tier 0+
  canPost: boolean;        // Tier 1+
  canAccept: boolean;      // Tier 2
  canMessage: boolean;     // Tier 1+
  canComplete: boolean;    // Tier 2
}

const TIER_REQUIREMENTS: Record<TrustTier, VerificationType[]> = {
  tier_0: [],
  tier_1: ['email', 'phone_sms', 'social_google'], // phone_sms OR phone_whatsapp, social_google OR social_apple
  tier_2: ['email', 'phone_sms', 'social_google', 'photos_complete', 'endorsement', 'mfa_enabled'],
};

export function useTrustTier() {
  const { user } = useAuth();
  const [state, setState] = useState<TrustTierState>({
    tier: 'tier_0',
    verifications: [],
    loading: true,
    canBrowse: true,
    canPost: false,
    canAccept: false,
    canMessage: false,
    canComplete: false,
  });

  const fetchTrustTier = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Fetch profile trust tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('trust_tier')
        .eq('user_id', user.id)
        .single();

      // Fetch verifications
      const { data: verifications } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user.id);

      const tier = (profile?.trust_tier as TrustTier) || 'tier_0';
      const tierNum = parseInt(tier.replace('tier_', ''));

      setState({
        tier,
        verifications: verifications || [],
        loading: false,
        canBrowse: true,
        canPost: tierNum >= 1,
        canAccept: tierNum >= 2,
        canMessage: tierNum >= 1,
        canComplete: tierNum >= 2,
      });
    } catch (error) {
      console.error('Error fetching trust tier:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchTrustTier();
  }, [fetchTrustTier]);

  const hasVerification = useCallback((type: VerificationType | VerificationType[]) => {
    const types = Array.isArray(type) ? type : [type];
    return types.some(t => state.verifications.some(v => v.verification_type === t));
  }, [state.verifications]);

  const getMissingForTier = useCallback((targetTier: TrustTier): VerificationType[] => {
    const requirements = TIER_REQUIREMENTS[targetTier];
    const missing: VerificationType[] = [];

    for (const req of requirements) {
      // Handle OR cases
      if (req === 'phone_sms' && !hasVerification(['phone_sms', 'phone_whatsapp'])) {
        missing.push('phone_sms');
      } else if (req === 'social_google' && !hasVerification(['social_google', 'social_apple'])) {
        missing.push('social_google');
      } else if (!['phone_sms', 'social_google'].includes(req) && !hasVerification(req)) {
        missing.push(req);
      }
    }

    return missing;
  }, [hasVerification]);

  const addVerification = async (type: VerificationType, metadata: Record<string, unknown> = {}) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('user_verifications')
      .insert({
        user_id: user.id,
        verification_type: type,
        metadata: metadata as unknown as null,
      });

    if (!error) {
      await fetchTrustTier();
    }

    return { error };
  };

  const refreshTier = async () => {
    if (!user) return;
    
    // Call the database function to recalculate
    await supabase.rpc('calculate_trust_tier', { p_user_id: user.id });
    await fetchTrustTier();
  };

  return {
    ...state,
    hasVerification,
    getMissingForTier,
    addVerification,
    refreshTier,
  };
}
