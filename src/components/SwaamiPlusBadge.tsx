import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwaamiPlusBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export function SwaamiPlusBadge({ size = "sm", className }: SwaamiPlusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        className
      )}
    >
      <Sparkles className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} />
      Plus
    </span>
  );
}
