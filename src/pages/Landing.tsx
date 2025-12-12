import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import swaamiWordmark from "@/assets/swaami-wordmark.png";

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect logged-in users to app
  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  // Show nothing while checking auth to prevent flash
  if (loading) {
    return null;
  }

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
        {/* Gradient overlay - darker in middle for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-black/50 to-background/90" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        {/* Header - Wordmark with Tagline */}
        <header className="pt-safe px-6 py-8">
          <div className="animate-fade-in">
            <img
              src={swaamiWordmark}
              alt="Swaami"
              className="h-10 md:h-12 w-auto drop-shadow-2xl"
            />
            <p className="text-sm md:text-base font-medium text-accent mt-1 tracking-wide text-shadow-sub">
              serve all.
            </p>
          </div>
        </header>

        {/* Main Hero Content */}
        <main className="flex-1 flex flex-col justify-center px-6 py-6 max-w-lg mx-auto w-full">
          <div 
            className="animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            {/* Headline */}
            <div className="space-y-4 mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight font-display text-shadow-hero">
                Get help from verified neighbours{" "}
                <span className="text-accent">in minutes.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/90 text-shadow-sub">
                Quick favours. Trusted faces. Walking distance.
              </p>
            </div>

            {/* Trust Badges - simplified to 2 */}
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <div className="flex items-center gap-1.5 text-sm text-white/90 text-shadow-sub">
                <Shield className="h-4 w-4 text-accent drop-shadow-lg" />
                <span>Verified neighbours</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/90 text-shadow-sub">
                <Heart className="h-4 w-4 text-accent drop-shadow-lg" />
                <span>Free, always</span>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom CTAs */}
        <footer 
          className="px-6 pb-safe pt-4 bg-gradient-to-t from-background via-background/95 to-transparent animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          <div className="max-w-lg mx-auto w-full space-y-2 pb-4">
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              variant="swaami"
              size="xl"
              className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg"
            >
              Join Your Neighbourhood
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              Takes 2 minutes. No credit card.
            </p>

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
