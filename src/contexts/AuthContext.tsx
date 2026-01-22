import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout, TIMEOUT_MS } from "@/lib/timeout";

// Stable localStorage key for onboarding completion - acts as resilience fallback
const ONBOARDING_COMPLETED_KEY = "swaami_onboarding_completed";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  city: string | null;
  neighbourhood: string | null;
  radius: number;
  skills: string[];
  availability: string;
  credits: number;
  tasks_completed: number;
  reliability_score: number;
  trust_tier: "tier_0" | "tier_1" | "tier_2" | null;
  is_demo: boolean | null;
  created_at: string;
  updated_at: string;
}

export type AuthState = "loading" | "unauthenticated" | "needs_onboarding" | "ready";
export type AuthStatus = AuthState;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  authState: AuthState;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  markOnboardingComplete: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  // Resilience flag: if true, user has completed onboarding even if profile fetch fails
  const [onboardingCompletedFlag, setOnboardingCompletedFlag] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Mark onboarding as complete - called after successful profile update
  const markOnboardingComplete = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
      setOnboardingCompletedFlag(true);
      console.log("[AuthContext] Onboarding marked complete in localStorage");
    } catch (err) {
      console.error("[AuthContext] Failed to save onboarding flag:", err);
    }
  }, []);

  // Clear onboarding flag on sign out
  const clearOnboardingFlag = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      setOnboardingCompletedFlag(false);
    } catch {
      // Ignore errors
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    const startTime = performance.now();
    setProfileLoading(true);
    console.log("[AuthContext] Starting profile fetch for user:", userId);

    try {
      // Use NORMAL timeout (10s) instead of FAST (5s) to reduce timeout errors
      const result = await withTimeout(
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single(),
        TIMEOUT_MS.NORMAL, // Increased from FAST (5s) to NORMAL (10s) for better reliability
        "Profile fetch timed out. Please check your connection and try again."
      );

      const elapsed = Math.round(performance.now() - startTime);
      console.log(`[AuthContext] Profile fetch completed in ${elapsed}ms`);

      if (result.error) {
        console.error("[AuthContext] Error fetching profile:", result.error);
        setProfile(null);
      } else {
        setProfile(result.data);
        // If profile is complete, ensure localStorage flag is set
        const isComplete = result.data?.city &&
                           result.data?.neighbourhood &&
                           result.data?.phone &&
                           (result.data?.skills?.length ?? 0) > 0;
        if (isComplete && !onboardingCompletedFlag) {
          markOnboardingComplete();
        }
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[AuthContext] Profile fetch failed after ${elapsed}ms:`, errorMsg);
      setProfile(null);
      // Don't clear onboarding flag on fetch failure - that's the resilience mechanism
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let initCompleted = false;

    const initAuth = async () => {
      const startTime = performance.now();
      console.log("[AuthContext] Starting auth initialization...");

      try {
        // Use NORMAL timeout (10s) instead of FAST (5s) for better reliability
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          TIMEOUT_MS.NORMAL, // Increased from FAST (5s) to NORMAL (10s)
          "Auth session fetch timed out. Please check your connection."
        );

        const elapsed = Math.round(performance.now() - startTime);
        console.log(`[AuthContext] Auth session fetched in ${elapsed}ms`);

        if (error) {
          console.error('[AuthContext] Auth session error:', error);
        }

        const initialSession = data?.session;

        if (!mounted) return;

        setSession(initialSession ?? null);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          console.log("[AuthContext] User found, fetching profile...");
          await fetchProfile(initialSession.user.id);
        } else {
          console.log("[AuthContext] No user session found");
        }

        initCompleted = true;
        setAuthLoading(false);
        console.log(`[AuthContext] Auth init complete in ${Math.round(performance.now() - startTime)}ms`);
      } catch (err) {
        const elapsed = Math.round(performance.now() - startTime);
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[AuthContext] Auth init failed after ${elapsed}ms:`, errorMsg);
        // On error or timeout, assume unauthenticated immediately
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          initCompleted = true;
          setAuthLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        // Only update authLoading if init has completed to avoid race conditions
        if (initCompleted) {
          setAuthLoading(false);
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            await fetchProfile(newSession.user.id);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    clearOnboardingFlag(); // Clear onboarding flag on explicit sign out
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Session refresh error:", error);
        if (error.message?.includes("refresh_token_not_found") || 
            error.message?.includes("invalid_grant")) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        return false;
      }
      
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        if (newSession.user) {
          await fetchProfile(newSession.user.id);
        }
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Session refresh error:", err);
      return false;
    }
  };

  const isLoading = authLoading || profileLoading;

  const authState = useMemo((): AuthState => {
    if (authLoading || profileLoading) {
      return "loading";
    }
    if (!user) {
      return "unauthenticated";
    }
    
    const isComplete = profile?.city && 
                       profile?.neighbourhood && 
                       profile?.phone && 
                       (profile?.skills?.length ?? 0) > 0;
    
    // RESILIENCE: If profile fetch failed but user previously completed onboarding,
    // treat them as "ready" to prevent redirect loop back to /join
    if (!isComplete) {
      if (onboardingCompletedFlag) {
        console.log("[AuthContext] Profile incomplete but onboarding flag set - treating as ready");
        return "ready";
      }
      return "needs_onboarding";
    }
    
    return "ready";
  }, [authLoading, profileLoading, user, profile, onboardingCompletedFlag]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    authState,
    isLoading,
    signOut,
    refreshProfile,
    refreshSession,
    markOnboardingComplete,
  }), [user, session, profile, authState, isLoading, markOnboardingComplete]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export const useAuthContext = useAuth;
