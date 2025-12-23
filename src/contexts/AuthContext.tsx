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

// Alias for backwards compatibility
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

  // Fetch profile for a given user
  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

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

  // Initialize auth state once on mount
  useEffect(() => {
    let mounted = true;

    // Get initial session with timeout fallback
    const initAuth = async () => {
      // Timeout fallback - don't let auth hang forever (5s max)
      const timeoutId = setTimeout(() => {
        if (mounted) {
          setAuthLoading(false);
        }
      }, 5000);
      
      try {
        const { data, error } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Auth session error:', error);
        }
        
        const initialSession = data?.session;
        
        if (!mounted) return;
        
        setSession(initialSession ?? null);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("Auth init error:", err);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Fetch profile on sign in or token refresh
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            await fetchProfile(newSession.user.id);
          }
        } else {
          // Clear profile on sign out
          setProfile(null);
        }
        
        setAuthLoading(false);
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

  const refreshSession = async () => {
    try {
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        if (newSession.user) {
          await fetchProfile(newSession.user.id);
        }
      }
    } catch (err) {
      console.error("Session refresh error:", err);
    }
  };

  const isLoading = authLoading || profileLoading;

  // Compute auth state from current data
  const authState = useMemo((): AuthState => {
    if (authLoading || profileLoading) return "loading";
    if (!user) return "unauthenticated";
    
    // Check if profile is complete
    const isComplete = profile?.city && 
                       profile?.neighbourhood && 
                       profile?.phone && 
                       (profile?.skills?.length ?? 0) > 0;
    
    if (!isComplete) return "needs_onboarding";
    
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

// Alias for backwards compatibility with components using useAuthContext
export const useAuthContext = useAuth;
