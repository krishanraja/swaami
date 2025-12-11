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
    <div className="h-[100dvh] w-full overflow-hidden bg-background flex flex-col">
      {/* Top Section - Logo & Tagline (40%) */}
      <div className="flex-[4] flex flex-col items-center justify-center px-6">
        <div className="animate-fade-in">
          <img
            src={swaamiLogo}
            alt="Swaami"
            className="h-40 w-auto mb-4"
          />
        </div>
        <p 
          className="text-muted-foreground text-lg tracking-wide animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          serve all.
        </p>
      </div>

      {/* Middle Section - Value Prop (35%) */}
      <div className="flex-[3.5] flex flex-col items-center justify-center px-8 text-center">
        <h1 
          className="text-2xl md:text-3xl font-semibold text-foreground leading-tight mb-6 animate-fade-in"
          style={{ animationDelay: "400ms" }}
        >
          Your neighbours need a hand.
          <br />
          <span className="text-accent">You have two.</span>
        </h1>

        {/* Live Nearby Indicator */}
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/30 animate-fade-in"
          style={{ animationDelay: "600ms" }}
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

      {/* Bottom Section - CTAs (25%) */}
      <div 
        className="flex-[2.5] flex flex-col items-center justify-start px-8 gap-4 animate-fade-in"
        style={{ animationDelay: "800ms" }}
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
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Heart className="h-3 w-3 text-accent" />
          <span>Building stronger neighbourhoods</span>
        </div>
      </div>
    </div>
  );
}
