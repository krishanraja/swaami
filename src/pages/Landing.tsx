import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Shield, Clock, Users } from "lucide-react";
import swaamiLogo from "@/assets/swaami-logo.png";

export default function Landing() {
  const navigate = useNavigate();
  const [nearbyCount, setNearbyCount] = useState(0);

  // Simulate nearby helpers count with gentle animation
  useEffect(() => {
    const target = Math.floor(Math.random() * 12) + 8; // 8-19 helpers
    let current = 0;
    const interval = setInterval(() => {
      if (current < target) {
        current++;
        setNearbyCount(current);
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full overflow-hidden bg-background flex flex-col relative">
      {/* Video Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-[25%_center]"
        >
          <source src="/videos/swaami-background.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/90" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        {/* Header - Logo */}
        <header className="pt-safe px-6 py-4">
          <div className="animate-fade-in">
            <img
              src={swaamiLogo}
              alt="Swaami"
              className="h-10 md:h-12 w-auto"
            />
          </div>
        </header>

        {/* Main Hero Content */}
        <main className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
          {/* Headline */}
          <div className="space-y-4 mb-8">
            <h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight animate-fade-in font-display"
              style={{ animationDelay: "100ms" }}
            >
              Get help from verified neighbours{" "}
              <span className="text-accent">in minutes.</span>
            </h1>
            
            <p 
              className="text-lg md:text-xl text-muted-foreground animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              Quick favours. Trusted faces. Walking distance.
            </p>
          </div>

          {/* Live Activity Indicator */}
          <div 
            className="flex items-center gap-3 mb-8 animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent/15 border border-accent/25">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <MapPin className="h-4 w-4 text-foreground/70" />
              <span className="text-sm font-medium text-foreground">
                {nearbyCount} neighbours helping nearby
              </span>
            </div>
          </div>

          {/* Trust Badges */}
          <div 
            className="flex flex-wrap gap-3 mb-10 animate-fade-in"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-accent" />
              <span>Verified members</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-accent" />
              <span>Response in minutes</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-accent" />
              <span>100% free</span>
            </div>
          </div>
        </main>

        {/* Bottom CTAs */}
        <footer 
          className="px-6 pb-safe pt-4 bg-gradient-to-t from-background via-background/95 to-transparent animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          <div className="max-w-lg mx-auto w-full space-y-3 pb-4">
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl shadow-lg shadow-accent/20 font-display"
            >
              Find Help Near You
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              onClick={() => navigate("/auth?mode=login")}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              Already a member?{" "}
              <span className="ml-1 underline underline-offset-2">Sign in</span>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
