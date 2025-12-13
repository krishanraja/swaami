import { useEffect, useState, useCallback } from "react";
import swaamiIcon from "@/assets/swaami-icon.png";

interface SplashScreenProps {
  onComplete?: () => void;
  /** Minimum display time in ms (default: 1800) */
  minDisplayTime?: number;
}

type SplashPhase = 'preload' | 'enter' | 'hold' | 'exit';

/**
 * Premium splash screen with guaranteed stable loading
 * 
 * Loading strategy (Google-app-level):
 * 1. Show brand color instantly (no assets needed)
 * 2. Preload icon in background
 * 3. Once loaded, fade in the full splash
 * 4. Animate and exit gracefully
 */
const SplashScreen = ({ onComplete, minDisplayTime = 1800 }: SplashScreenProps) => {
  const [phase, setPhase] = useState<SplashPhase>('preload');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Preload the image
  useEffect(() => {
    const img = new Image();
    img.src = swaamiIcon;
    
    const handleLoad = () => {
      setImageLoaded(true);
    };

    // If already cached, it loads synchronously
    if (img.complete) {
      setImageLoaded(true);
    } else {
      img.onload = handleLoad;
      // Fallback: if image fails, still proceed after timeout
      img.onerror = () => {
        console.warn('[SplashScreen] Icon failed to load, proceeding anyway');
        setImageLoaded(true);
      };
    }

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  // Start animation once image is loaded
  useEffect(() => {
    if (imageLoaded && phase === 'preload') {
      // Small delay for smoother transition from preload to enter
      const timer = setTimeout(() => setPhase('enter'), 50);
      return () => clearTimeout(timer);
    }
  }, [imageLoaded, phase]);

  // Phase transitions
  useEffect(() => {
    if (phase === 'enter') {
      const timer = setTimeout(() => setPhase('hold'), 400);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Minimum display time tracking
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), minDisplayTime);
    return () => clearTimeout(timer);
  }, [minDisplayTime]);

  // Exit and complete when ready
  useEffect(() => {
    if (phase === 'hold' && minTimeElapsed) {
      const exitTimer = setTimeout(() => setPhase('exit'), 100);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, minTimeElapsed]);

  // Complete after exit animation
  useEffect(() => {
    if (phase === 'exit') {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // Preload phase: brand color only, no assets needed
  if (phase === 'preload') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        {/* Simple pulsing dot while loading - pure CSS, instant */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-all duration-500 ease-out ${
        phase === 'exit' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
      role="status"
      aria-label="Loading Swaami"
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
          aria-hidden="true"
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
        
        {/* Icon - centered within the ring, guaranteed loaded */}
        <img 
          src={swaamiIcon} 
          alt="" 
          aria-hidden="true"
          className={`w-14 h-14 relative z-10 transition-all duration-500 ease-out ${
            phase === 'enter' ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
          }`}
          style={{
            filter: 'drop-shadow(0 0 12px hsl(var(--primary)/0.25))',
          }}
        />
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Loading Swaami application</span>
    </div>
  );
};

export default SplashScreen;
