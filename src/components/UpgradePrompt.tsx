import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Check, Zap, MapPin, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";
import { toast } from "sonner";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: "post_limit" | "radius" | "general";
}

const benefits = [
  { icon: Zap, text: "Unlimited help requests" },
  { icon: MapPin, text: "2km radius (4x more neighbours)" },
  { icon: Crown, text: "Priority matching" },
  { icon: Sparkles, text: "Premium badge on your profile" },
];

export function UpgradePrompt({ open, onOpenChange, trigger = "general" }: UpgradePromptProps) {
  const { startCheckout } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await startCheckout();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const triggerMessages = {
    post_limit: "You've used all your free posts this month.",
    radius: "Unlock a wider radius to reach more neighbours.",
    general: "Get more from Swaami with our premium plan.",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-2 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            Upgrade to Swaami+
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            {triggerMessages[trigger]}
          </p>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-xl space-y-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-white dark:bg-background p-1.5 rounded-lg shadow-sm">
                  <benefit.icon className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          <div className="text-center py-2">
            <span className="text-3xl font-bold">$2</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Maybe later
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? "Loading..." : "Upgrade now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
