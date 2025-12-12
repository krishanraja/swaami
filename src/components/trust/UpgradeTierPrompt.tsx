import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, ShieldCheck, Lock } from "lucide-react";
import type { TrustTier } from "@/hooks/useTrustTier";
import { cn } from "@/lib/utils";

interface UpgradeTierPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: TrustTier;
  requiredTier: TrustTier;
  action: string;
  onUpgrade: () => void;
}

const tierInfo: Record<TrustTier, {
  label: string;
  icon: typeof Shield;
  requirements: string[];
}> = {
  tier_0: {
    label: 'Guest',
    icon: Shield,
    requirements: ['Unverified email'],
  },
  tier_1: {
    label: 'Verified',
    icon: Shield,
    requirements: ['Verified email', 'Verified phone', 'Connected social account'],
  },
  tier_2: {
    label: 'Trusted',
    icon: ShieldCheck,
    requirements: ['All Tier 1 requirements', '3 profile photos', 'Endorsement from member', '2FA enabled'],
  },
};

export function UpgradeTierPrompt({
  open,
  onOpenChange,
  currentTier,
  requiredTier,
  action,
  onUpgrade,
}: UpgradeTierPromptProps) {
  const required = tierInfo[requiredTier];
  const RequiredIcon = required.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            Verification required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To <strong>{action}</strong>, you need to be at least <strong>{required.label}</strong> level.
          </p>

          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <RequiredIcon className="w-5 h-5 text-primary" />
              <span className="font-medium">{required.label} requirements:</span>
            </div>
            <ul className="space-y-1">
              {required.requirements.map((req, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={onUpgrade}>
              Verify now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
