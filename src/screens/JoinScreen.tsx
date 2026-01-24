import { useState, useRef, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { withTimeout, TimeoutError, TIMEOUT_MS } from "@/lib/timeout";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, ArrowLeft, Shield, MapPin, Heart, Gift, AlertCircle, RefreshCw } from "lucide-react";
import swaamiIcon from "@/assets/swaami-icon.png";

interface JoinScreenProps {
  onComplete: () => void;
  refetchProfile: () => Promise<void>;
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

export function JoinScreen({ onComplete, refetchProfile }: JoinScreenProps) {
  const { markOnboardingComplete, authState } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [city, setCity] = useState<City | null>(null);
  const [neighbourhood, setNeighbourhood] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [radius, setRadius] = useState(500);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<'now' | 'later' | 'this-week'>('now');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const isSubmittingRef = useRef(false);
  const hasRestoredRef = useRef(false);

  // Restore onboarding progress from localStorage on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) {
        const progress: OnboardingProgress = JSON.parse(saved);
        
        // Validate city is a valid value
        const validCities: City[] = ['sydney', 'new_york'];
        const validatedCity = progress.city && validCities.includes(progress.city) 
          ? progress.city 
          : null;
        
        // Validate step is a valid value
        const validSteps: Step[] = ['welcome', 'location', 'phone', 'otp', 'preferences'];
        const validatedStep = progress.step && validSteps.includes(progress.step)
          ? progress.step
          : 'welcome';
        
        // Validate availability
        const validAvailability: Array<'now' | 'later' | 'this-week'> = ['now', 'later', 'this-week'];
        const validatedAvailability = progress.availability && validAvailability.includes(progress.availability)
          ? progress.availability
          : 'now';
        
        // Validate phoneVerified is consistent with phone
        const validatedPhoneVerified = progress.phoneVerified && progress.phone 
          ? progress.phoneVerified 
          : false;
        
        // If phoneVerified but no phone, something is wrong - reset to phone step
        const finalStep = validatedPhoneVerified && !progress.phone 
          ? 'phone' 
          : validatedStep;
        
        // If on preferences step but not phoneVerified, go back to phone
        const safeStep = finalStep === 'preferences' && !validatedPhoneVerified
          ? 'phone'
          : finalStep;
        
        // Progress restored from localStorage
        
        setStep(safeStep);
        setCity(validatedCity);
        setNeighbourhood(progress.neighbourhood || '');
        setPhone(progress.phone || '');
        setRadius(progress.radius || 500);
        setSelectedSkills(Array.isArray(progress.selectedSkills) ? progress.selectedSkills : []);
        setAvailability(validatedAvailability);
        setPhoneVerified(validatedPhoneVerified);
      }
    } catch (error) {
      console.error("Failed to restore onboarding progress:", error);
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }, []);

  // Save onboarding progress to localStorage whenever it changes
  useEffect(() => {
    if (!hasRestoredRef.current) return;
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
      console.error("[JoinScreen] Please enter a valid phone number");
      return;
    }

    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    
    const requestStartTime = Date.now();
    
    try {
      // Sending OTP
      
      // Get auth token from localStorage directly to avoid supabase client hanging
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const projectId = supabaseUrl?.split('//')[1]?.split('.')[0] || '';
      
      let accessToken = supabaseKey;
      try {
        const storedSession = localStorage.getItem(`sb-${projectId}-auth-token`);
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          if (parsed?.access_token) {
            accessToken = parsed.access_token;
          }
        }
      } catch (e) {
        // Using apikey for auth (no stored session)
      }
      
      
      // Use direct fetch instead of supabase.functions.invoke to avoid hanging issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-phone-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ phone, action: 'send' }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const duration = Date.now() - requestStartTime;
      const data = await response.json();
      

      if (!response.ok) {
        console.error('[JoinScreen] OTP service error:', data.error);
        throw new Error(data.error || "Failed to send verification code");
      }
      
      if (data?.error) {
        console.error('[JoinScreen] OTP service error:', data.error);
        throw new Error(data.error);
      }

      setStep('otp');
    } catch (error) {
      const duration = Date.now() - requestStartTime;
      
      // Determine error type for better user messaging
      let errorMessage = "Failed to send verification code";
        if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          errorMessage = "Request timed out. Please check your connection and try again.";
        } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      console.error("[JoinScreen] OTP error:", errorMessage);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      console.error("[JoinScreen] Please enter the 6-digit code");
      return;
    }

    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    try {
      // Get auth token from localStorage directly to avoid supabase client hanging
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const projectId = supabaseUrl?.split('//')[1]?.split('.')[0] || '';
      
      let accessToken = supabaseKey;
      try {
        const storedSession = localStorage.getItem(`sb-${projectId}-auth-token`);
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          if (parsed?.access_token) {
            accessToken = parsed.access_token;
          }
        }
      } catch (e) {
        // Using apikey for auth (no stored session)
      }
      
      // Use direct fetch instead of supabase.functions.invoke to avoid hanging issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-phone-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ phone, action: 'verify', code: otp }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Verification failed");
      if (data?.error) throw new Error(data.error);

      if (data?.verified) {
        setPhoneVerified(true);
        setStep('preferences');
      }
    } catch (error) {
      console.error("[JoinScreen] OTP verify error:", error);
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
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Get user with proper timeout
      const { data: userData } = await withTimeout(
        supabase.auth.getUser(),
        TIMEOUT_MS.NORMAL,
        "Request timed out getting user. Please try again."
      );
      
      const user = userData?.user;
      if (!user) throw new Error("Not authenticated. Please sign in again.");
      

      // Update profile with proper timeout
      const updateResult = await withTimeout(
        supabase
          .from('profiles')
          .update({
            city,
            neighbourhood,
            phone,
            radius,
            skills: selectedSkills,
            availability,
          })
          .eq('user_id', user.id)
          .select()
          .single(),
        TIMEOUT_MS.NORMAL,
        "Profile update timed out. Please try again."
      );

      if (updateResult.error) {
        throw new Error(updateResult.error.message || "Failed to update profile");
      }
      const updatedProfile = updateResult.data;
      if (!updatedProfile) throw new Error("Profile update returned no data");
      
      
      // Verify the profile meets "ready" criteria before navigating
      const isComplete = updatedProfile.city && 
                         updatedProfile.neighbourhood && 
                         updatedProfile.phone && 
                         (updatedProfile.skills?.length ?? 0) > 0;
      
      if (!isComplete) {
        throw new Error("Profile is still incomplete. Please fill in all required fields.");
      }

      // Mark onboarding complete BEFORE refreshing profile
      markOnboardingComplete();

      // Refresh profile context with proper timeout to ensure authState updates
      await withTimeout(
        refetchProfile(),
        TIMEOUT_MS.NORMAL,
        "Profile refresh timed out. Your profile was saved - please refresh the page."
      );
      
      // Small delay to ensure React state has propagated before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      clearProgress();
      onComplete();
    } catch (err) {
      let errorMessage = "Something went wrong. Please try again.";
      if (err instanceof TimeoutError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("[JoinScreen] Profile update error:", errorMessage);
      setError(errorMessage);
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

      <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-2 overflow-hidden">
        {/* Logo */}
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
              
              {/* Error banner */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-destructive font-medium">Something went wrong</p>
                    <p className="text-sm text-destructive/80 mt-1">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-destructive/60 hover:text-destructive shrink-0"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">How far will you go to help?</p>
                  <RadiusSlider value={radius} onChange={setRadius} />
                </div>
                
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
                  ) : error ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Try Again
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

      {/* Progress indicator */}
      <div className="shrink-0 pb-4 px-6">
        <div className="flex gap-2 justify-center">
          {STEPS.filter(s => s !== 'otp').map((s) => {
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
}
