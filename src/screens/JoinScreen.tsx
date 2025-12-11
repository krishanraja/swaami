import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillChip } from "@/components/SkillChip";
import { RadiusSlider } from "@/components/RadiusSlider";
import { AvailabilitySelector } from "@/components/AvailabilitySelector";
import { SKILLS } from "@/types/swaami";
import swaamiLogo from "@/assets/swaami-logo.png";

interface JoinScreenProps {
  onComplete: () => void;
}

type Step = 'phone' | 'otp' | 'radius' | 'skills' | 'availability';

export function JoinScreen({ onComplete }: JoinScreenProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [radius, setRadius] = useState(500);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<'now' | 'later' | 'this-week'>('now');

  const handlePhoneSubmit = () => {
    if (phone.length >= 10) {
      setStep('otp');
    }
  };

  const handleOtpSubmit = () => {
    if (otp.length === 4) {
      setStep('radius');
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img src={swaamiLogo} alt="Swaami" className="h-48 w-auto" />
        </div>

        {/* Steps */}
        <div className="w-full max-w-sm">
          {step === 'phone' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Join your neighbourhood
                </h1>
                <p className="text-muted-foreground">
                  Enter your phone number to get started
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-lg h-12"
                />
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={handlePhoneSubmit}
                  disabled={phone.length < 10}
                >
                  Send code
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
                  placeholder="4-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 4))}
                  className="text-lg h-12 text-center tracking-[0.5em]"
                  maxLength={4}
                />
                <Button
                  variant="swaami"
                  size="xl"
                  className="w-full"
                  onClick={handleOtpSubmit}
                  disabled={otp.length !== 4}
                >
                  Verify
                </Button>
              </div>
            </div>
          )}

          {step === 'radius' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center">
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
                >
                  Join Swaami
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="pb-8 px-6">
        <div className="flex gap-2 justify-center">
          {['phone', 'otp', 'radius', 'skills', 'availability'].map((s, i) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                ['phone', 'otp', 'radius', 'skills', 'availability'].indexOf(step) >= i
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
