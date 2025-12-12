import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

interface ReadAloudButtonProps {
  text: string;
  className?: string;
}

export function ReadAloudButton({ text, className = "" }: ReadAloudButtonProps) {
  const { speakText, stopSpeaking, isSpeaking } = useAccessibility();

  const handleClick = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(text);
    }
  };

  // Check if speech synthesis is supported
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`gap-1 ${className}`}
      title={isSpeaking ? "Stop reading" : "Read aloud"}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-4 h-4" />
          <span className="sr-only">Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          <span className="text-xs">Read</span>
        </>
      )}
    </Button>
  );
}
