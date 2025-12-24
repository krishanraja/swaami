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
    // Timeout fallback - don't let profile fetch hang forever (3s max)
    const timeoutId = setTimeout(() => {
      setProfileLoading(false);
    }, 3000);
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Error fetching profile:", error);
        // Check if it's a session/auth error
        const errorCode = error.code || "";
        const errorMessage = error.message || "";
        const isAuthError = 
          errorCode.includes("PGRST301") || 
          errorCode.includes("42501") ||
          errorMessage.toLowerCase().includes("jwt") ||
          errorMessage.toLowerCase().includes("token") ||
          errorMessage.toLowerCase().includes("unauthorized");
        
        if (isAuthError) {
          console.warn("Profile fetch failed due to auth error - session may be expired");
          // Don't clear profile immediately - let session refresh handle it
        } else {
          // For other errors (like profile not found), clear profile
          setProfile(null);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Profile fetch error:", err);
      // Only clear profile if it's not an auth error
      const errorMessage = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      const isAuthError = 
        errorMessage.includes("jwt") ||
        errorMessage.includes("token") ||
        errorMessage.includes("unauthorized");
      
      if (!isAuthError) {
        setProfile(null);
      }
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
      
      let initialSession = null;
      try {
        const { data, error } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Auth session error:', error);
        }
        
        initialSession = data?.session;
        
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
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:109',message:'Auth init complete, setting authLoading=false',data:{hasSession:!!initialSession,hasUser:!!initialSession?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
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
          // Keep authLoading true until profile fetch completes
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            await fetchProfile(newSession.user.id);
          } else {
            // For other events (like PASSWORD_RECOVERY), we don't need to fetch profile
            // but we should still mark auth as loaded
            setAuthLoading(false);
          }
          // Set authLoading to false after profile fetch completes
          // (fetchProfile handles profileLoading, but we need to ensure authLoading is also false)
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:134',message:'Auth state change, profile fetch complete, setting authLoading=false',data:{event,hasSession:!!newSession,hasUser:!!newSession?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            setAuthLoading(false);
          }
        } else {
          // Clear profile on sign out
          setProfile(null);
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:134',message:'Auth state change, signed out, setting authLoading=false',data:{event,hasSession:false,hasUser:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          setAuthLoading(false);
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
        // If refresh fails, clear session
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

  // Compute auth state from current data
  const authState = useMemo((): AuthState => {
    // #region agent log
    const stateData = {authLoading,profileLoading,hasUser:!!user,hasProfile:!!profile,profileCity:profile?.city,profileNeighbourhood:profile?.neighbourhood,profilePhone:profile?.phone,profileSkillsLength:profile?.skills?.length??0};
    // #endregion
    if (authLoading || profileLoading) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:175',message:'AuthState computed: loading',data:stateData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return "loading";
    }
    if (!user) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:177',message:'AuthState computed: unauthenticated',data:stateData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return "unauthenticated";
    }
    
    // Check if profile is complete
    const isComplete = profile?.city && 
                       profile?.neighbourhood && 
                       profile?.phone && 
                       (profile?.skills?.length ?? 0) > 0;
    
    if (!isComplete) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:185',message:'AuthState computed: needs_onboarding',data:{...stateData,isComplete},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return "needs_onboarding";
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:187',message:'AuthState computed: ready',data:{...stateData,isComplete},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
