/**
 * Centralized Auth Context with Explicit State Machine
 * 
 * This is the single source of truth for authentication state.
 * All auth-related decisions should be based on the `authState.status` field.
 * 
 * States:
 * - loading: Initial state, checking stored session
 * - anonymous: No user session
 * - awaiting_verification: User signed up but email not verified
 * - signed_in: Authenticated but profile may be incomplete
 * - needs_onboarding: Authenticated but profile is incomplete
 * - ready: Fully authenticated and onboarded
 * - session_expired: Session was valid but has expired
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Profile type matching useProfile.ts
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

// Explicit auth state types
export type AuthStatus = 
  | "loading"
  | "anonymous"
  | "awaiting_verification"
  | "signed_in"
  | "needs_onboarding"
  | "ready"
  | "session_expired";

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isEmailVerified: boolean;
  isOnboarded: boolean;
}

interface AuthContextType {
  authState: AuthState;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  // Utility flags for common checks
  isAuthenticated: boolean;
  isLoading: boolean;
  canAccessApp: boolean;
}

const initialAuthState: AuthState = {
  status: "loading",
  user: null,
  session: null,
  profile: null,
  isEmailVerified: false,
  isOnboarded: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Check if a profile is considered "onboarded" (all required fields present)
 */
function checkOnboarded(profile: Profile | null): boolean {
  if (!profile) return false;
  if (!profile.phone) return false;
  if (!profile.city) return false;
  if (!profile.neighbourhood) return false;
  if (!profile.skills || profile.skills.length === 0) return false;
  return true;
}

/**
 * Derive auth status from user, session, and profile
 */
function deriveAuthStatus(
  user: User | null,
  session: Session | null,
  profile: Profile | null,
  sessionExpired: boolean
): AuthStatus {
  // Session expired
  if (sessionExpired) {
    return "session_expired";
  }

  // No user = anonymous
  if (!user || !session) {
    return "anonymous";
  }

  // Check email verification for email/password users
  const isOAuthUser = user.app_metadata?.provider !== 'email';
  const isEmailVerified = isOAuthUser || !!user.email_confirmed_at;
  
  if (!isEmailVerified) {
    return "awaiting_verification";
  }

  // User is verified, check onboarding
  const isOnboarded = checkOnboarded(profile);
  
  if (!isOnboarded) {
    return "needs_onboarding";
  }

  return "ready";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [sessionExpired, setSessionExpired] = useState(false);

  /**
   * Fetch user profile from database
   */
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // Profile might not exist yet (race condition with trigger)
        if (error.code === "PGRST116") {
          // Try to create it
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({ user_id: userId })
            .select()
            .single();

          if (!createError && newProfile) {
            return newProfile as Profile;
          }
          // Wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResult = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single();
          
          if (!retryResult.error && retryResult.data) {
            return retryResult.data as Profile;
          }
        }
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  }, []);

  /**
   * Update auth state based on session and profile
   */
  const updateAuthState = useCallback(async (
    session: Session | null,
    event?: AuthChangeEvent
  ) => {
    const user = session?.user ?? null;
    
    // Check for session expiry events
    if (event === "TOKEN_REFRESHED" && !session) {
      setSessionExpired(true);
      setAuthState({
        status: "session_expired",
        user: null,
        session: null,
        profile: null,
        isEmailVerified: false,
        isOnboarded: false,
      });
      return;
    }

    // Clear session expired flag if we have a valid session
    if (session) {
      setSessionExpired(false);
    }

    // No user = anonymous
    if (!user) {
      setAuthState({
        status: "anonymous",
        user: null,
        session: null,
        profile: null,
        isEmailVerified: false,
        isOnboarded: false,
      });
      return;
    }

    // Check email verification
    const isOAuthUser = user.app_metadata?.provider !== 'email';
    const isEmailVerified = isOAuthUser || !!user.email_confirmed_at;

    // If not verified, don't fetch profile
    if (!isEmailVerified) {
      setAuthState({
        status: "awaiting_verification",
        user,
        session,
        profile: null,
        isEmailVerified: false,
        isOnboarded: false,
      });
      return;
    }

    // Fetch profile
    const profile = await fetchProfile(user.id);
    const isOnboarded = checkOnboarded(profile);
    const status = deriveAuthStatus(user, session, profile, sessionExpired);

    setAuthState({
      status,
      user,
      session,
      profile,
      isEmailVerified,
      isOnboarded,
    });
  }, [fetchProfile, sessionExpired]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        updateAuthState(session, "INITIAL_SESSION" as AuthChangeEvent);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Handle specific events
        switch (event) {
          case "SIGNED_OUT":
            setAuthState({
              status: "anonymous",
              user: null,
              session: null,
              profile: null,
              isEmailVerified: false,
              isOnboarded: false,
            });
            setSessionExpired(false);
            break;

          case "TOKEN_REFRESHED":
            if (!session) {
              setSessionExpired(true);
              setAuthState(prev => ({
                ...prev,
                status: "session_expired",
              }));
            } else {
              await updateAuthState(session, event);
            }
            break;

          case "USER_UPDATED":
          case "SIGNED_IN":
          case "PASSWORD_RECOVERY":
            await updateAuthState(session, event);
            break;

          default:
            await updateAuthState(session, event);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateAuthState]);

  /**
   * Sign out user
   */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthState({
      status: "anonymous",
      user: null,
      session: null,
      profile: null,
      isEmailVerified: false,
      isOnboarded: false,
    });
    setSessionExpired(false);
  }, []);

  /**
   * Attempt to refresh the session
   * Returns true if successful, false otherwise
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        setSessionExpired(true);
        setAuthState(prev => ({
          ...prev,
          status: "session_expired",
        }));
        return false;
      }

      await updateAuthState(session, "TOKEN_REFRESHED");
      setSessionExpired(false);
      return true;
    } catch {
      setSessionExpired(true);
      return false;
    }
  }, [updateAuthState]);

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(async () => {
    if (!authState.user) return;
    
    const profile = await fetchProfile(authState.user.id);
    const isOnboarded = checkOnboarded(profile);
    const status = deriveAuthStatus(
      authState.user,
      authState.session,
      profile,
      sessionExpired
    );

    setAuthState(prev => ({
      ...prev,
      profile,
      isOnboarded,
      status,
    }));
  }, [authState.user, authState.session, fetchProfile, sessionExpired]);

  // Utility flags
  const isAuthenticated = authState.status === "signed_in" || 
                          authState.status === "needs_onboarding" || 
                          authState.status === "ready";
  const isLoading = authState.status === "loading";
  const canAccessApp = authState.status === "ready";

  return (
    <AuthContext.Provider
      value={{
        authState,
        signOut,
        refreshSession,
        refreshProfile,
        isAuthenticated,
        isLoading,
        canAccessApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook for legacy compatibility with useAuth
 * @deprecated Prefer useAuthContext for explicit state machine access
 */
export function useAuthLegacy() {
  const { authState, signOut } = useAuthContext();
  return {
    user: authState.user,
    session: authState.session,
    loading: authState.status === "loading",
    signOut,
  };
}


