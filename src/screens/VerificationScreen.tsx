import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTrustTier, type VerificationType } from "@/hooks/useTrustTier";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TrustBadge } from "@/components/trust/TrustBadge";
import { VerificationChecklist } from "@/components/trust/VerificationChecklist";
import { PhoneVerification } from "@/components/trust/PhoneVerification";
import { SocialConnect } from "@/components/trust/SocialConnect";
import { PhotoUpload } from "@/components/trust/PhotoUpload";
import { EndorsementRequest } from "@/components/trust/EndorsementRequest";
import { MFASetup } from "@/components/trust/MFASetup";
import type { City } from "@/hooks/useNeighbourhoods";

type VerificationModal = VerificationType | null;

export function VerificationScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { tier, verifications, loading, addVerification, refreshTier } = useTrustTier();
  const [activeModal, setActiveModal] = useState<VerificationModal>(null);
  const [photos, setPhotos] = useState<{ photo_type: string; photo_url: string }[]>([]);
  const [socialProviders, setSocialProviders] = useState<string[]>([]);

  const fetchPhotos = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_photos')
      .select('photo_type, photo_url')
      .eq('user_id', user.id);
    setPhotos(data || []);
  }, [user]);

  const fetchSocialConnections = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('social_connections')
      .select('provider')
      .eq('user_id', user.id);
    setSocialProviders(data?.map(d => d.provider) || []);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPhotos();
      fetchSocialConnections();
    }
  }, [user, fetchPhotos, fetchSocialConnections]);

  const handleVerify = (type: VerificationType) => {
    setActiveModal(type);
  };

  const handlePhoneVerified = async (channel: 'sms' | 'whatsapp') => {
    const type = channel === 'whatsapp' ? 'phone_whatsapp' : 'phone_sms';
    await addVerification(type as VerificationType);
    setActiveModal(null);
    await refreshTier();
  };

  const handleSocialConnected = async (provider: 'google' | 'apple') => {
    const type = provider === 'google' ? 'social_google' : 'social_apple';
    await addVerification(type as VerificationType);
    setSocialProviders(prev => [...prev, provider]);
    setActiveModal(null);
    await refreshTier();
  };

  const handlePhotosComplete = async () => {
    await addVerification('photos_complete');
    await fetchPhotos();
    setActiveModal(null);
    await refreshTier();
  };

  const handleMFAComplete = async () => {
    await addVerification('mfa_enabled');
    setActiveModal(null);
    await refreshTier();
  };

  const city = (profile?.city as City) || 'sydney';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Verification</h1>
          <TrustBadge tier={tier} />
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 pb-24">
        {/* Current tier */}
        <div className="text-center space-y-2">
          <TrustBadge tier={tier} size="lg" showLabel />
          {tier === 'tier_0' && (
            <p className="text-sm text-muted-foreground">
              Complete verification steps to unlock features
            </p>
          )}
          {tier === 'tier_1' && (
            <p className="text-sm text-muted-foreground">
              You can now post tasks and message neighbours
            </p>
          )}
          {tier === 'tier_2' && (
            <p className="text-sm text-primary">
              Full access unlocked!
            </p>
          )}
        </div>

        {/* Verification checklist */}
        <VerificationChecklist
          verifications={verifications}
          onVerify={handleVerify}
          targetTier={tier === 'tier_2' ? 'tier_2' : tier === 'tier_1' ? 'tier_2' : 'tier_1'}
        />

        {/* Endorsement section */}
        <div className="pt-4 border-t border-border">
          <EndorsementRequest />
        </div>
      </main>

      {/* Phone verification modal */}
      <Dialog open={activeModal === 'phone_sms' || activeModal === 'phone_whatsapp'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-sm">
          <PhoneVerification
            city={city}
            onVerified={handlePhoneVerified}
            onCancel={() => setActiveModal(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Social connect modal */}
      <Dialog open={activeModal === 'social_google' || activeModal === 'social_apple'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-sm">
          <SocialConnect
            connectedProviders={socialProviders}
            onConnected={handleSocialConnected}
          />
        </DialogContent>
      </Dialog>

      {/* Photo upload modal */}
      <Dialog open={activeModal === 'photos_complete'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-sm">
          <PhotoUpload
            existingPhotos={photos}
            onComplete={handlePhotosComplete}
            onCancel={() => setActiveModal(null)}
          />
        </DialogContent>
      </Dialog>

      {/* MFA setup modal */}
      <Dialog open={activeModal === 'mfa_enabled'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-sm">
          <MFASetup
            onComplete={handleMFAComplete}
            onCancel={() => setActiveModal(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
