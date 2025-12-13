import { useEffect, useState } from "react";
import wellwellIcon from "@/assets/wellwell-icon.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Phase 1: Enter animation complete after 400ms
    const enterTimer = setTimeout(() => setPhase('hold'), 400);
    // Phase 2: Start exit after 1.8s total
    const exitTimer = setTimeout(() => setPhase('exit'), 1800);
    // Phase 3: Complete and unmount after exit animation (2.3s total)
    const completeTimer = setTimeout(onComplete, 2300);
    
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-all duration-500 ease-out ${
        phase === 'exit' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle radial gradient background */}
      <div 
        className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.12)_0%,_transparent_60%)] transition-opacity duration-700 ${
          phase === 'enter' ? 'opacity-0' : 'opacity-100'
        }`} 
      />
      
      {/* Centered container - fixed size for precise alignment */}
      <div 
        className={`relative w-24 h-24 flex items-center justify-center transition-all duration-500 ease-out ${
          phase === 'enter' ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
        }`}
      >
        {/* Soft glow - no animation, just static ambiance */}
        <div className="absolute inset-0 -m-2 rounded-full bg-primary/8 blur-2xl" />
        
        {/* Loading ring - perfectly centered SVG */}
        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 96 96"
          style={{ 
            animation: phase !== 'enter' ? 'spin 2s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
          }}
        >
          {/* Background track */}
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="hsl(var(--muted)/0.5)"
            strokeWidth="1.5"
          />
          {/* Progress arc */}
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="url(#splashGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="69 208"
            strokeDashoffset="0"
            style={{
              filter: 'drop-shadow(0 0 6px hsl(var(--primary)/0.4))',
              transition: 'stroke-dasharray 0.5s ease-out',
            }}
          />
          <defs>
            <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Icon - centered within the ring */}
        <img 
          src={wellwellIcon} 
          alt="WellWell" 
          className={`w-14 h-14 relative z-10 transition-all duration-500 ease-out ${
            phase === 'enter' ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
          }`}
          style={{
            filter: 'drop-shadow(0 0 12px hsl(var(--primary)/0.25))',
          }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
