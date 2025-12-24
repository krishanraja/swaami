import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    
    try {
      // Increased timeout to 20 seconds for slow connections
      const profilePromise = supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Set a timeout to stop blocking UI, but let request continue
      const timeoutId = setTimeout(() => {
        // Stop blocking UI after 3 seconds, but let request continue
        setProfileLoading(false);
      }, 3000);

      const { data, error } = await profilePromise;
      clearTimeout(timeoutId);

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let initCompleted = false;

    const initAuth = async () => {
      try {
        // Increased timeout to 15 seconds for slow connections
        const sessionPromise = supabase.auth.getSession();
        
        // Create a timeout that allows UI to become interactive
        let timeoutFired = false;
        const timeoutId = setTimeout(() => {
          timeoutFired = true;
          // Allow UI to become interactive even if request is still pending
          if (mounted) {
            initCompleted = true;
            setAuthLoading(false);
            // Assume unauthenticated for now, will update when request completes
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }, 3000); // Show UI as interactive after 3 seconds, even if request pending

        try {
          const { data, error } = await sessionPromise;
          clearTimeout(timeoutId);
          
          if (error) {
            console.error('Auth session error:', error);
          }
          
          const initialSession = data?.session;
          
          if (!mounted) return;
          
          // Update state even if timeout already fired
          setSession(initialSession ?? null);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id);
          } else if (!timeoutFired) {
            // Only set loading to false if timeout didn't already fire
            initCompleted = true;
            setAuthLoading(false);
          }
        } catch (err) {
          clearTimeout(timeoutId);
          console.error("Auth init error:", err);
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            initCompleted = true;
            setAuthLoading(false);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
        // On error, assume unauthenticated
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
    
    if (!isComplete) {
      return "needs_onboarding";
    }
    
    return "ready";
  }, [authLoading, profileLoading, user, profile]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    authState,
    isLoading,
    signOut,
    refreshProfile,
    refreshSession,
  }), [user, session, profile, authState, isLoading]);

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
