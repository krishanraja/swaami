import swaamiIcon from "@/assets/swaami-icon.png";

interface SplashScreenProps {
  onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="relative flex flex-col items-center gap-8">
        {/* Icon container */}
        <div className="relative">
          {/* Single smooth loading ring */}
          <svg 
            className="absolute inset-0 w-32 h-32 -m-4"
            viewBox="0 0 100 100"
          >
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="hsl(var(--muted)/0.3)"
              strokeWidth="2"
            />
            {/* Progress arc - CSS animation */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="72 217"
              className="origin-center animate-[spin_1.4s_linear_infinite]"
              style={{ transformOrigin: '50% 50%' }}
            />
          </svg>
          
          {/* Static icon - no animation */}
          <img
            src={swaamiIcon}
            alt="Swaami"
            className="w-24 h-24 object-contain"
          />
        </div>
        
        {/* Subtle dots loader instead of pulsing text */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-[bounce_1s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
