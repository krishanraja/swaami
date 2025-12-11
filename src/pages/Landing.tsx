import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Heart, ArrowRight } from "lucide-react";
import swaamiLogo from "@/assets/swaami-logo.png";

export default function Landing() {
  const navigate = useNavigate();
  const [nearbyCount, setNearbyCount] = useState(0);

  // Simulate nearby needs count with gentle animation
  useEffect(() => {
    const target = Math.floor(Math.random() * 8) + 5; // 5-12 needs
    let current = 0;
    const interval = setInterval(() => {
      if (current < target) {
        current++;
        setNearbyCount(current);
      } else {
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-background flex flex-col relative">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-[25%_center] opacity-20 pointer-events-none z-0"
      >
        <source src="/videos/swaami-background.mp4" type="video/mp4" />
      </video>

      {/* Content Container - above video */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top Section - Logo (flexible, minimum guaranteed) */}
        <div className="flex-1 flex items-center justify-center px-6 min-h-[180px]">
          <div className="animate-fade-in">
            <img
              src={swaamiLogo}
              alt="Swaami"
              className="h-64 md:h-80 w-auto"
            />
          </div>
        </div>

        {/* Middle Section - Value Prop (never shrinks) */}
        <div className="shrink-0 flex flex-col items-center px-6 text-center gap-4 pb-6">
          <div 
            className="flex flex-col items-center gap-3 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <h1 className="text-xl md:text-3xl font-semibold text-foreground">
              Your neighbours need a hand.
            </h1>
            <span className="text-xl md:text-3xl font-semibold text-accent bg-swaami-yellow-highlight px-3 py-1.5 rounded-lg">
              You have two.
            </span>
          </div>

          {/* Live Nearby Indicator */}
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 animate-fade-in"
            style={{ animationDelay: "400ms" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <MapPin className="h-4 w-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">
              {nearbyCount} needs nearby
            </span>
          </div>
        </div>

        {/* Bottom Section - CTAs (never shrinks, guaranteed minimum height) */}
        <div 
          className="shrink-0 min-h-[160px] flex flex-col items-center justify-center px-6 gap-3 pb-safe animate-fade-in"
          style={{ animationDelay: "600ms" }}
        >
          <Button
            onClick={() => navigate("/auth?mode=signup")}
            size="lg"
            className="w-full max-w-xs h-14 text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl shadow-lg"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button
            onClick={() => navigate("/auth?mode=login")}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            Already helping? <span className="ml-1 underline">Sign in</span>
          </Button>

          {/* Trust indicator */}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Heart className="h-3 w-3 text-accent" />
            Building stronger neighbourhoods
          </p>
        </div>
      </div>
    </div>
  );
}
