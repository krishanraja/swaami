import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Heart, LogOut, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLiveActivity } from "@/hooks/useLiveActivity";
import { SplashScreen } from "@/components/SplashScreen";

// Use public folder paths for preloaded assets (faster initial load)
const swaamiWordmark = "/images/swaami-wordmark.png";
const videoPoster = "/videos/swaami-poster.jpg";

export default function Landing() {
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { tasksCompletedToday, activeHelpers, isLoading: activityLoading } = useLiveActivity();

  // Hide splash after minimum display time and auth loads
  useEffect(() => {
    const minDisplayTime = 1500; // 1.5 seconds minimum
    const timer = setTimeout(() => {
      if (!authLoading) {
        setShowSplash(false);
      }
    }, minDisplayTime);
    
    return () => clearTimeout(timer);
  }, [authLoading]);

  // Also hide splash when auth finishes after minimum time
  useEffect(() => {
    if (!authLoading && !showSplash) return;
    const timer = setTimeout(() => {
      if (!authLoading) setShowSplash(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [authLoading, showSplash]);

  // Single unified loading state - wait for auth and profile together
  const isLoading = authLoading || profileLoading;

  // Check profile completeness (safe access when profile is null)
  const isProfileComplete = profile?.city && profile?.neighbourhood && profile?.phone && profile?.skills?.length > 0;

  // Determine CTA based on user state
  const getPrimaryCTA = () => {
    if (!user) return { text: "Join Your Neighbourhood", path: "/auth?mode=signup" };
    if (isProfileComplete) return { text: "Go to Your Neighbourhood", path: "/app" };
    return { text: "Continue Your Setup", path: "/join" };
  };

  const primaryCTA = getPrimaryCTA();

  const handleSignOut = async () => {
    await signOut();
  };

  // Check if we have activity data to show
  const hasActivityData = tasksCompletedToday > 0 || activeHelpers > 0;

  return (
    <>
      {/* Splash Screen */}
      {showSplash && <SplashScreen />}
      
      <div className="min-h-[100dvh] w-full overflow-hidden bg-background flex flex-col relative">
      {/* Background with poster - shows immediately, never re-renders */}
      <div className="absolute inset-0 z-0">
        {/* Poster image - displays instantly while video loads */}
        <img
          src={videoPoster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-[25%_center]"
          loading="eager"
        />
        {/* Video overlays poster once loaded */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={videoPoster}
          className="absolute inset-0 w-full h-full object-cover object-[25%_center]"
        >
          <source src="/videos/swaami-background.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-black/50 to-background/90" />
      </div>
      
      {/* Content Container - single animation on stable outer container */}
      <div className="relative z-10 flex flex-col min-h-[100dvh] animate-fade-in">
        {/* Header - always shows logo immediately */}
        <header className="pt-safe px-6 py-8">
          <div>
            <img
              src={swaamiWordmark}
              alt="Swaami"
              className="h-10 md:h-12 w-auto drop-shadow-2xl"
              loading="eager"
            />
            <p className="text-sm md:text-base font-medium text-primary mt-1 tracking-wide text-shadow-sub">
              serve all.
            </p>
          </div>
        </header>

        {/* Main Hero Content - always rendered, opacity controlled by loading state */}
        <main 
          className="flex-1 flex flex-col justify-center px-6 py-6 max-w-lg mx-auto w-full transition-opacity duration-300"
          style={{ opacity: isLoading ? 0 : 1 }}
        >
          <div>
            {/* Welcome Back Greeting - use opacity instead of conditional render */}
            <p 
              className="text-accent font-medium text-lg mb-2 text-shadow-sub transition-opacity duration-200"
              style={{ opacity: user ? 1 : 0, height: user ? 'auto' : 0, marginBottom: user ? '0.5rem' : 0 }}
            >
              Welcome back!
            </p>

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

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <div className="flex items-center gap-1.5 text-sm text-white/90 text-shadow-sub">
                <Shield className="h-4 w-4 text-accent drop-shadow-lg" />
                <span>Verified neighbours</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/90 text-shadow-sub">
                <Heart className="h-4 w-4 text-accent drop-shadow-lg" />
                <span>Free to start</span>
              </div>
            </div>
            
            {/* Live Activity Counter - reserved space, opacity transition */}
            <div 
              className="mt-6 min-h-[40px] transition-opacity duration-300"
              style={{ opacity: (!activityLoading && hasActivityData) ? 1 : 0 }}
            >
              <div className="flex items-center gap-2 text-sm text-white/80 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full w-fit">
                <Users className="h-4 w-4 text-accent" />
                <span>
                  {tasksCompletedToday > 0 && (
                    <span className="font-semibold text-white">{tasksCompletedToday} neighbours helped today</span>
                  )}
                  {tasksCompletedToday > 0 && activeHelpers > 0 && " · "}
                  {activeHelpers > 0 && (
                    <span>{activeHelpers} active helpers</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom CTAs - always rendered, opacity controlled */}
        <footer 
          className="px-6 pb-safe pt-4 bg-gradient-to-t from-background via-background/95 to-transparent transition-opacity duration-300"
          style={{ opacity: isLoading ? 0 : 1 }}
        >
          <div className="max-w-lg mx-auto w-full space-y-2 pb-4">
            <Button
              onClick={() => navigate(primaryCTA.path)}
              variant="swaami"
              size="xl"
              className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg"
            >
              {primaryCTA.text}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            {/* User state CTAs - always render both, show one with opacity */}
            <div className="relative">
              {/* Logged out state */}
              <div 
                className="transition-opacity duration-200"
                style={{ opacity: !user ? 1 : 0, pointerEvents: !user ? 'auto' : 'none', position: user ? 'absolute' : 'relative', inset: 0 }}
              >
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

              {/* Logged in state */}
              <div 
                className="transition-opacity duration-200"
                style={{ opacity: user ? 1 : 0, pointerEvents: user ? 'auto' : 'none', position: !user ? 'absolute' : 'relative', inset: 0 }}
              >
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground hover:bg-transparent"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </>
  );
}
