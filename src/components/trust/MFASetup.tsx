import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2, Check, Copy, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface MFASetupProps {
  onComplete: () => void;
  onCancel?: () => void;
}

type Step = 'intro' | 'qr' | 'verify';

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const startEnrollment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('qr');
    } catch (error) {
      console.error('MFA enroll error:', error);
      toast({
        title: "Setup failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!factorId || code.length !== 6) return;

    setLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "2FA enabled!",
        description: "Your account is now protected with two-factor authentication",
      });
      onComplete();
    } catch (error) {
      console.error('MFA verify error:', error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Please check your code and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    if (!secret) return;
    
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback
    }
  };

  if (step === 'intro') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Enable two-factor authentication</h3>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <p>You'll need an authenticator app like:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Google Authenticator</li>
            <li>Authy</li>
            <li>1Password</li>
            <li>Microsoft Authenticator</li>
          </ul>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            className="flex-1" 
            onClick={startEnrollment}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get started'}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Scan QR code</h3>
          <p className="text-sm text-muted-foreground">
            Open your authenticator app and scan this code
          </p>
        </div>

        {qrCode && (
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
          </div>
        )}

        {secret && (
          <div className="space-y-2">
            <p className="text-xs text-center text-muted-foreground">
              Or enter this code manually:
            </p>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <code className="flex-1 text-xs font-mono text-center break-all">
                {secret}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={copySecret}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        <Button className="w-full" onClick={() => setStep('verify')}>
          I've scanned the code
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Enter verification code</h3>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="text-center text-2xl tracking-widest font-mono"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setStep('qr')}
        >
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={verifyCode}
          disabled={code.length !== 6 || loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
        </Button>
      </div>
    </div>
  );
}
