import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillChip } from "@/components/SkillChip";
import { RadiusSlider } from "@/components/RadiusSlider";
import { AvailabilitySelector } from "@/components/AvailabilitySelector";
import { CitySelector } from "@/components/onboarding/CitySelector";
import { NeighbourhoodSelector } from "@/components/onboarding/NeighbourhoodSelector";
import { PhoneInput, isValidPhone } from "@/components/onboarding/PhoneInput";
import { SKILLS } from "@/types/swaami";
import { City, CITY_CONFIG } from "@/hooks/useNeighbourhoods";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, ArrowLeft, Shield, MapPin, Heart } from "lucide-react";
import swaamiIcon from "@/assets/swaami-icon.png";

interface JoinScreenProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'city' | 'neighbourhood' | 'phone' | 'otp' | 'radius' | 'skills' | 'availability';

const STEPS: Step[] = ['welcome', 'city', 'neighbourhood', 'phone', 'otp', 'radius', 'skills', 'availability'];

export function JoinScreen({ onComplete }: JoinScreenProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [city, setCity] = useState<City | null>(null);
  const [neighbourhood, setNeighbourhood] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [radius, setRadius] = useState(500);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<'now' | 'later' | 'this-week'>('now');
  const [loading, setLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

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

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-phone-otp', {
        body: { phone, action: 'send' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Verification code sent!");
      setStep('otp');
    } catch (error: any) {
      console.error("OTP send error:", error);
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

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
        setStep('radius');
      }
    } catch (error: any) {
      console.error("OTP verify error:", error);
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
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

      toast.success("Welcome to Swaami!");
      onComplete();
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Logo */}
        <div className="mb-6 animate-fade-in">
          <img src={swaamiIcon} alt="Swaami" className="h-32 w-auto" />
        </div>

        {/* Steps */}
        <div className="w-full max-w-sm">
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
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={() => setStep('city')}
                >
                  Let's get started
                </Button>
              </div>
            </div>
          )}

          {step === 'city' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Where are you?
                </h1>
                <p className="text-muted-foreground">
                  Select your city to get started
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
                <CitySelector value={city} onChange={setCity} />
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={() => setStep('neighbourhood')}
                  disabled={!city}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'neighbourhood' && city && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Your neighbourhood
                </h1>
                <p className="text-muted-foreground">
                  Where do you call home?
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
                <NeighbourhoodSelector
                  city={city}
                  value={neighbourhood}
                  onChange={setNeighbourhood}
                />
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={() => setStep('phone')}
                  disabled={!neighbourhood}
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

          {step === 'radius' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-600">Phone verified</span>
                </div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Set your help radius
                </h1>
                <p className="text-muted-foreground">
                  How far are you willing to go?
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
                <RadiusSlider value={radius} onChange={setRadius} />
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={() => setStep('skills')}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'skills' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  What can you help with?
                </h1>
                <p className="text-muted-foreground">
                  Select your skills
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
                <div className="flex flex-wrap gap-2 stagger-children">
                  {SKILLS.map((skill) => (
                    <SkillChip
                      key={skill.id}
                      skill={skill}
                      selected={selectedSkills.includes(skill.id)}
                      onToggle={() => toggleSkill(skill.id)}
                    />
                  ))}
                </div>
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full mt-4"
                  onClick={() => setStep('availability')}
                  disabled={selectedSkills.length === 0}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'availability' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  When are you available?
                </h1>
                <p className="text-muted-foreground">
                  Set your default availability
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
                <AvailabilitySelector value={availability} onChange={setAvailability} />
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full mt-4"
                  onClick={handleComplete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Join Swaami"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="shrink-0 pb-8 px-6">
        <div className="flex gap-2 justify-center">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                currentStepIndex >= i
                  ? 'bg-foreground w-8'
                  : 'bg-foreground/20 w-4'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
