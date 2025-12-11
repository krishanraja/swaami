import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditWalletProps {
  credits: number;
  previousCredits?: number;
  size?: "sm" | "md" | "lg";
  showAnimation?: boolean;
}

export function CreditWallet({ 
  credits, 
  previousCredits, 
  size = "md",
  showAnimation = true 
}: CreditWalletProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const earned = previousCredits !== undefined && credits > previousCredits;

  useEffect(() => {
    if (earned && showAnimation) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [credits, earned, showAnimation]);

  const sizeClasses = {
    sm: "text-sm px-2 py-1 gap-1",
    md: "text-base px-3 py-1.5 gap-1.5",
    lg: "text-lg px-4 py-2 gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-primary/30 font-medium text-foreground transition-all",
        sizeClasses[size],
        isAnimating && "scale-110 bg-accent/30"
      )}
    >
      <Coins 
        className={cn(
          iconSizes[size],
          "text-accent",
          isAnimating && "animate-bounce"
        )} 
      />
      <span>{credits}</span>
      {isAnimating && (
        <span className="text-accent font-bold animate-fade-in">
          +{credits - (previousCredits ?? 0)}
        </span>
      )}
    </div>
  );
}
