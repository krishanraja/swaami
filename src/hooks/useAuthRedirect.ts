import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, AuthState } from "@/contexts/AuthContext";

interface UseAuthRedirectOptions {
  /** Only redirect if currently on this path */
  onlyOnPath?: string;
  /** Custom redirect paths for each auth state */
  redirects?: {
    unauthenticated?: string;
    needs_onboarding?: string;
    ready?: string;
  };
  /** Whether to add returnTo query param */
  addReturnTo?: boolean;
}

/**
 * Consolidated hook for handling auth-based redirects
 * Prevents redirect loops and coordinates redirects across pages
 */
export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { authState, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    onlyOnPath,
    redirects = {},
    addReturnTo = false,
  } = options;

  useEffect(() => {
    // Don't redirect while loading - wait for auth state to resolve
    if (isLoading || authState === "loading") {
      return;
    }

    // If onlyOnPath is specified, only redirect if we're on that path
    if (onlyOnPath && location.pathname !== onlyOnPath) {
      return;
    }

    // Determine redirect path based on auth state
    let redirectPath: string | null = null;

    if (authState === "unauthenticated" && redirects.unauthenticated) {
      redirectPath = redirects.unauthenticated;
    } else if (authState === "needs_onboarding" && redirects.needs_onboarding) {
      redirectPath = redirects.needs_onboarding;
    } else if (authState === "ready" && redirects.ready) {
      redirectPath = redirects.ready;
    }

    // Perform redirect if needed
    if (redirectPath) {
      let finalUrl = redirectPath;
      
      // Add returnTo query param if requested
      if (addReturnTo && location.pathname !== "/" && location.pathname !== redirectPath) {
        const separator = redirectPath.includes("?") ? "&" : "?";
        finalUrl = `${redirectPath}${separator}returnTo=${encodeURIComponent(location.pathname)}`;
      }

      navigate(finalUrl, { replace: true });
    }
  }, [authState, isLoading, location.pathname, navigate, onlyOnPath, redirects, addReturnTo]);
}

