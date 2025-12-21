import { useState, useRef, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillChip } from "@/components/SkillChip";
import { RadiusSlider } from "@/components/RadiusSlider";
import { AvailabilitySelector } from "@/components/AvailabilitySelector";
import { CitySelector } from "@/components/onboarding/CitySelector";
import { NeighbourhoodSelector } from "@/components/onboarding/NeighbourhoodSelector";
import { PhoneInput, isValidPhone } from "@/components/onboarding/PhoneInput";
import { SKILLS } from "@/types/swaami";
import { City } from "@/hooks/useNeighbourhoods";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, ArrowLeft, Shield, MapPin, Heart, Gift } from "lucide-react";
import swaamiIcon from "@/assets/swaami-icon.png";

interface JoinScreenProps {
  onComplete: () => void;
}

// Streamlined 4-step flow: Welcome → Location → Phone → Skills+Preferences
type Step = 'welcome' | 'location' | 'phone' | 'otp' | 'preferences';

const STEPS: Step[] = ['welcome', 'location', 'phone', 'otp', 'preferences'];

const ONBOARDING_STORAGE_KEY = 'swaami_onboarding_progress';

interface OnboardingProgress {
  step: Step;
  city: City | null;
  neighbourhood: string;
  phone: string;
  radius: number;
  selectedSkills: string[];
  availability: 'now' | 'later' | 'this-week';
  phoneVerified: boolean;
}

export const JoinScreen = memo(function JoinScreen({ onComplete }: JoinScreenProps) {
  // #region agent log
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'JoinScreen.tsx:render',message:'Component RENDERING',data:{renderCount:renderCountRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F,G,H,I'})}).catch(()=>{});
  // #endregion
  const { refetch: refetchProfile } = useProfile();
  const [step, setStepInternal] = useState<Step>('welcome');
  // #region agent log
  const setStep = (newStep: Step) => {
    fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'JoinScreen.tsx:setStep',message:'Step changing',data:{from:step,to:newStep},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
    setStepInternal(newStep);
  };
  // #endregion
  const [city, setCityInternal] = useState<City | null>(null);
  // #region agent log
  const setCity = (newCity: City | null) => {
    fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'JoinScreen.tsx:setCity',message:'City state changing',data:{from:city,to:newCity},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,E'})}).catch(()=>{});
    setCityInternal(newCity);
  };
  // #endregion
  const [neighbourhood, setNeighbourhood] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [radius, setRadius] = useState(500);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<'now' | 'later' | 'this-week'>('now');
  const [loading, setLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const isSubmittingRef = useRef(false);
  const hasRestoredRef = useRef(false);

  // Restore onboarding progress from localStorage on mount
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'JoinScreen.tsx:restoreEffect',message:'Restore effect RUNNING',data:{hasRestoredAlready:hasRestoredRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G,H'})}).catch(()=>{});
    // #endregion
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'JoinScreen.tsx:restoreEffect:read',message:'localStorage read',data:{hasSaved:!!saved,savedStep:saved?JSON.parse(saved).step:null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      if (saved) {
        const progress: OnboardingProgress = JSON.parse(saved);
        setStep(progress.step);
        setCity(progress.city);
        setNeighbourhood(progress.neighbourhood || '');
        setPhone(progress.phone || '');
        setRadius(progress.radius || 500);
        setSelectedSkills(progress.selectedSkills || []);
        setAvailability(progress.availability || 'now');
        setPhoneVerified(progress.phoneVerified || false);
      }
    } catch (error) {
      console.error("Failed to restore onboarding progress:", error);
      // Clear corrupted data
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }, []);

  // Save onboarding progress to localStorage whenever it changes
  useEffect(() => {
    if (!hasRestoredRef.current) return; // Don't save until we've restored
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'JoinScreen.tsx:saveEffect',message:'localStorage save effect RUNNING',data:{step,city,neighbourhood},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      const progress: OnboardingProgress = {
        step,
        city,
        neighbourhood,
        phone,
        radius,
        selectedSkills,
        availability,
        phoneVerified,
      };
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save onboarding progress:", error);
    }
  }, [step, city, neighbourhood, phone, radius, selectedSkills, availability, phoneVerified]);

  // Clear onboarding progress on completion
  const clearProgress = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear onboarding progress:", error);
    }
  };

  const currentStepIndex = STEPS.indexOf(step);
  const canGoBack = currentStepIndex > 0;

  const goBack = () => {
    if (canGoBack) {
      setStep(STEPS[currentStepIndex - 1]);
    }
  };

  const handleSendOtp = async () => {
    if (!city || !isValidPhone(phone, city)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Prevent double submit
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-phone-otp', {
        body: { phone, action: 'send' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Verification code sent!");
      setStep('otp');
    } catch (error) {
      console.error("OTP send error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send verification code");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    // Prevent double submit
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-phone-otp', {
        body: { phone, action: 'verify', code: otp }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.verified) {
        toast.success("Phone verified!");
        setPhoneVerified(true);
        setStep('preferences');
      }
    } catch (error) {
      console.error("OTP verify error:", error);
      toast.error(error instanceof Error ? error.message : "Invalid verification code");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleComplete = async () => {
    // Prevent double submit
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update profile with all onboarding data
      const { error } = await supabase
        .from('profiles')
        .update({
          city,
          neighbourhood,
          phone,
          radius,
          skills: selectedSkills,
          availability,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Refetch profile to ensure it's updated in local state
      await refetchProfile();

      toast.success("Welcome to Swaami! 🎉", {
        description: "You've earned 5 credits to get started!"
      });
      
      // Clear onboarding progress on successful completion
      clearProgress();
      
      // Only call onComplete after update succeeds and profile is refetched
      onComplete();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
      // Don't call onComplete if update fails
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header with back button */}
      <div className="shrink-0 p-4">
        {canGoBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-2 overflow-y-auto">
        {/* Logo - removed animate-fade-in to prevent re-triggering */}
        <div className="mb-4 shrink-0">
          <img src={swaamiIcon} alt="Swaami" className="h-20 w-auto" />
        </div>

        {/* Steps */}
        <div className="w-full max-w-sm shrink-0">
          {step === 'welcome' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Welcome to Swaami 👋
                </h1>
                <p className="text-muted-foreground">
                  Get help from verified neighbours in minutes.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
                <div className="space-y-4 text-sm text-foreground/80">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <span>All members are verified by phone</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <span>Help neighbours within walking distance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-primary shrink-0" />
                    <span>Give help, earn credits, get help back</span>
                  </div>
                </div>
                
                {/* Welcome gift teaser */}
                <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-xl">
                  <Gift className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm text-accent font-medium">
                    Complete setup to get 5 free credits!
                  </span>
                </div>
                
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={() => setStep('location')}
                >
                  Let's get started
                </Button>
              </div>
            </div>
          )}

          {/* Combined Location Step (City + Neighbourhood) */}
          {step === 'location' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Where are you?
                </h1>
                <p className="text-muted-foreground">
                  We'll connect you with nearby neighbours
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">City</p>
                    <CitySelector value={city} onChange={setCity} />
                  </div>
                  
                  {city && (
                    <div className="animate-fade-in">
                      {/* #region agent log */}
                      {(() => { fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'JoinScreen.tsx:conditionalRender',message:'Neighbourhood section MOUNTING',data:{city},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{}); return null; })()}
                      {/* #endregion */}
                      <p className="text-sm font-medium text-foreground mb-2">Neighbourhood</p>
                      <NeighbourhoodSelector
                        city={city}
                        value={neighbourhood}
                        onChange={setNeighbourhood}
                      />
                    </div>
                  )}
                </div>
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={() => setStep('phone')}
                  disabled={!city || !neighbourhood}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'phone' && city && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Verify your phone
                </h1>
                <p className="text-muted-foreground">
                  For secure neighbourhood connections
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
                <PhoneInput
                  city={city}
                  value={phone}
                  onChange={setPhone}
                  disabled={loading}
                />
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={handleSendOtp}
                  disabled={!isValidPhone(phone, city) || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send verification code"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'otp' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Enter verification code
                </h1>
                <p className="text-muted-foreground">
                  Sent to {phone}
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-lg h-12 text-center tracking-[0.5em]"
                  maxLength={6}
                  disabled={loading}
                />
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Didn't receive it? Resend code
                </button>
              </div>
            </div>
          )}

          {/* Combined Preferences Step (Radius + Skills + Availability) */}
          {step === 'preferences' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-600">Phone verified</span>
                </div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Almost there!
                </h1>
                <p className="text-muted-foreground">
                  Set your preferences
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
                {/* Radius */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">How far will you go to help?</p>
                  <RadiusSlider value={radius} onChange={setRadius} />
                </div>
                
                {/* Skills */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">What can you help with?</p>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <SkillChip
                        key={skill.id}
                        skill={skill}
                        selected={selectedSkills.includes(skill.id)}
                        onToggle={() => toggleSkill(skill.id)}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Availability */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">When are you usually available?</p>
                  <AvailabilitySelector value={availability} onChange={setAvailability} />
                </div>
                
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={handleComplete}
                  disabled={selectedSkills.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Gift className="h-5 w-5 mr-2" />
                      Join & Get 5 Credits
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator - simplified for 4 steps */}
      <div className="shrink-0 pb-4 px-6">
        <div className="flex gap-2 justify-center">
          {STEPS.filter(s => s !== 'otp').map((s, i) => {
            const stepIndex = STEPS.indexOf(s);
            const isActive = currentStepIndex >= stepIndex || (s === 'preferences' && step === 'otp');
            return (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-foreground w-8'
                    : 'bg-foreground/20 w-4'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
