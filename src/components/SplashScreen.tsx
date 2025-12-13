import swaamiIcon from "@/assets/swaami-icon.png";

interface SplashScreenProps {
  onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Loading container */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Icon with loading ring */}
        <div className="relative">
          {/* Animated loading ring */}
          <svg 
            className="absolute inset-0 w-28 h-28 -m-2 animate-spin" 
            style={{ animationDuration: '2s' }}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="70 213"
              className="origin-center"
            />
          </svg>
          
          {/* Swaami icon */}
          <img
            src={swaamiIcon}
            alt="Swaami"
            className="w-24 h-24 object-contain drop-shadow-lg animate-pulse-soft"
          />
        </div>
        
        {/* Loading text */}
        <p className="text-sm text-muted-foreground font-medium tracking-wide animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
