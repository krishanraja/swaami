import { Check, Circle, Mail, Phone, Users, Camera, UserCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationType } from "@/hooks/useTrustTier";
import { Button } from "@/components/ui/button";

interface VerificationChecklistProps {
  verifications: { verification_type: VerificationType }[];
  onVerify: (type: VerificationType) => void;
  targetTier?: 'tier_1' | 'tier_2';
}

interface VerificationItem {
  type: VerificationType | VerificationType[];
  label: string;
  description: string;
  icon: typeof Mail;
  tier: 'tier_1' | 'tier_2';
}

const VERIFICATION_ITEMS: VerificationItem[] = [
  {
    type: 'email',
    label: 'Email verified',
    description: 'Confirm your email address',
    icon: Mail,
    tier: 'tier_1',
  },
  {
    type: ['phone_sms', 'phone_whatsapp'],
    label: 'Phone verified',
    description: 'Verify via SMS or WhatsApp',
    icon: Phone,
    tier: 'tier_1',
  },
  {
    type: ['social_google', 'social_apple'],
    label: 'Social account connected',
    description: 'Link Google or Apple account',
    icon: Users,
    tier: 'tier_1',
  },
  {
    type: 'photos_complete',
    label: 'Profile photos uploaded',
    description: 'Upload 3 profile photos',
    icon: Camera,
    tier: 'tier_2',
  },
  {
    type: 'endorsement',
    label: 'Endorsed by member',
    description: 'Get endorsed by a verified user',
    icon: UserCheck,
    tier: 'tier_2',
  },
  {
    type: 'mfa_enabled',
    label: '2FA enabled',
    description: 'Set up two-factor authentication',
    icon: Lock,
    tier: 'tier_2',
  },
];

export function VerificationChecklist({ 
  verifications, 
  onVerify,
  targetTier = 'tier_2'
}: VerificationChecklistProps) {
  const hasVerification = (type: VerificationType | VerificationType[]) => {
    const types = Array.isArray(type) ? type : [type];
    return types.some(t => verifications.some(v => v.verification_type === t));
  };

  const filteredItems = VERIFICATION_ITEMS.filter(item => {
    if (targetTier === 'tier_1') return item.tier === 'tier_1';
    return true;
  });

  const completedCount = filteredItems.filter(item => hasVerification(item.type)).length;
  const progress = (completedCount / filteredItems.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Verification progress</span>
          <span className="font-medium">{completedCount}/{filteredItems.length}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {filteredItems.map((item) => {
          const isCompleted = hasVerification(item.type);
          const Icon = item.icon;
          const primaryType = Array.isArray(item.type) ? item.type[0] : item.type;

          return (
            <div 
              key={primaryType}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                isCompleted 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-card border-border hover:border-primary/30'
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium text-sm',
                  isCompleted && 'text-primary'
                )}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>

              {!isCompleted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVerify(primaryType)}
                  className="flex-shrink-0"
                >
                  Verify
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
