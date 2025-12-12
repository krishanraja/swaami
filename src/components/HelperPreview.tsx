import { Users } from "lucide-react";
import { useHelperPreview } from "@/hooks/useHelperPreview";

interface HelperPreviewProps {
  category?: string;
}

export function HelperPreview({ category }: HelperPreviewProps) {
  const { count, isLoading } = useHelperPreview(category);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 animate-pulse">
        <Users className="h-4 w-4" />
        <span>Finding helpers...</span>
      </div>
    );
  }

  if (count === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm bg-accent/10 text-accent rounded-lg px-3 py-2 animate-fade-in">
      <Users className="h-4 w-4" />
      <span>
        <span className="font-semibold">{count} helper{count !== 1 ? "s" : ""}</span> nearby can help with this
      </span>
    </div>
  );
}
