import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PhoneInput, isValidPhone } from "@/components/onboarding/PhoneInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, MessageCircle, Loader2 } from "lucide-react";
import type { City } from "@/hooks/useNeighbourhoods";

interface PhoneVerificationProps {
  city: City;
  onVerified: (channel: 'sms' | 'whatsapp') => void;
  onCancel?: () => void;
}

type Channel = 'sms' | 'whatsapp';
type Step = 'phone' | 'otp';

export function PhoneVerification({ city, onVerified, onCancel }: PhoneVerificationProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<Channel>('sms');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOtp = async () => {
    if (!isValidPhone(phone, city)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-phone-otp', {
        body: { phone, action: 'send', channel }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to send OTP');

      setStep('otp');
      toast({
        title: "Code sent!",
        description: `Check your ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} for the verification code`,
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      toast({
        title: "Failed to send code",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-phone-otp', {
        body: { phone, action: 'verify', otp }
      });

      if (error) throw error;
      if (!data.verified) throw new Error(data.error || 'Verification failed');

      toast({
        title: "Phone verified!",
        description: "Your phone number has been verified",
      });
      onVerified(data.channel || channel);
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Enter verification code</h3>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to your {channel === 'whatsapp' ? 'WhatsApp' : 'phone'}
          </p>
        </div>

        <div className="flex justify-center">
          <InputOTP 
            maxLength={6} 
            value={otp} 
            onChange={setOtp}
            onComplete={handleVerifyOtp}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setStep('phone');
              setOtp('');
            }}
          >
            Back
          </Button>
          <Button
            className="flex-1"
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6 || loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
          </Button>
        </div>

        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleSendOtp}
          disabled={loading}
        >
          Didn't receive a code? Resend
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Verify your phone</h3>
        <p className="text-sm text-muted-foreground">
          We'll send you a verification code
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Phone number</Label>
          <PhoneInput
            city={city}
            value={phone}
            onChange={setPhone}
          />
        </div>

        <div className="space-y-2">
          <Label>Send code via</Label>
          <RadioGroup
            value={channel}
            onValueChange={(v) => setChannel(v as Channel)}
            className="grid grid-cols-2 gap-2"
          >
            <Label
              htmlFor="sms"
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                channel === 'sms' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <RadioGroupItem value="sms" id="sms" className="sr-only" />
              <Smartphone className="w-4 h-4" />
              <span className="text-sm font-medium">SMS</span>
            </Label>
            <Label
              htmlFor="whatsapp"
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                channel === 'whatsapp' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <RadioGroupItem value="whatsapp" id="whatsapp" className="sr-only" />
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">WhatsApp</span>
            </Label>
          </RadioGroup>
        </div>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={handleSendOtp}
          disabled={!isValidPhone(phone, city) || loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send code'}
        </Button>
      </div>
    </div>
  );
}
