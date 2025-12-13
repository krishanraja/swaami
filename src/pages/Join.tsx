import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { JoinScreen } from "@/screens/JoinScreen";

export default function Join() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Not logged in, redirect to auth
        navigate("/auth?mode=signup");
        return;
      }

      // Check if email is confirmed
      if (!session.user.email_confirmed_at) {
        navigate("/auth?mode=login");
        return;
      }

      // Check if profile is already complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("city, neighbourhood, phone, skills")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.city && profile?.neighbourhood && profile?.phone && profile?.skills?.length > 0) {
        // Profile already complete, go to app
        navigate("/app");
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth?mode=signup");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleComplete = () => {
    navigate("/app");
  };

  // Keep showing loading state during redirects - never return null
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  return <JoinScreen onComplete={handleComplete} />;
}
