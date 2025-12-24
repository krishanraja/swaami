/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication and/or onboarding.
 * Handles redirects based on auth state without scattered logic.
 * 
 * Usage:
 *   <ProtectedRoute requireAuth={true} requireOnboarding={true}>
 *     <YourComponent />
 *   </ProtectedRoute>
 */

import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, AuthState } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Require user to be authenticated */
  requireAuth?: boolean;
  /** Require user to have completed onboarding */
  requireOnboarding?: boolean;
  /** Redirect to this path instead of default */
  redirectTo?: string;
  /** Show custom loading component */
  loadingComponent?: ReactNode;
  /** Redirect authenticated users away (for auth pages) */
  redirectIfAuthenticated?: boolean;
  /** Where to redirect authenticated users */
  authenticatedRedirect?: string;
}

/**
 * Default loading spinner
 */
function DefaultLoader() {
  return (
    <div className="h-[100dvh] bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground animate-pulse">
          Loading...
        </span>
      </div>
    </div>
  );
}

/**
 * Map auth status to redirect path
 */
function getRedirectPath(
  status: AuthState,
  requireAuth: boolean,
  requireOnboarding: boolean
): string | null {
  switch (status) {
    case "unauthenticated":
      if (requireAuth) return "/auth?mode=signup";
      return null;

    case "needs_onboarding":
      if (requireOnboarding) return "/join";
      return null;

    case "ready":
      return null;

    case "loading":
    default:
      return null;
  }
}

export function ProtectedRoute({
  children,
  requireAuth = false,
  requireOnboarding = false,
  redirectTo,
  loadingComponent,
  redirectIfAuthenticated = false,
  authenticatedRedirect = "/app",
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Handle redirect for authenticated users (e.g., on auth page)
    if (redirectIfAuthenticated) {
      if (authState === "ready") {
        navigate(authenticatedRedirect, { replace: true });
        return;
      }
      if (authState === "needs_onboarding") {
        navigate("/join", { replace: true });
        return;
      }
      // Stay on current page if unauthenticated or loading
      return;
    }

    // Handle protected route redirects
    const defaultRedirect = getRedirectPath(
      authState,
      requireAuth,
      requireOnboarding
    );

    if (defaultRedirect) {
      const finalRedirect = redirectTo || defaultRedirect;
      
      // Add return URL for post-auth navigation
      const returnUrl = location.pathname !== "/" ? location.pathname : undefined;
      const url = returnUrl 
        ? `${finalRedirect}${finalRedirect.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(returnUrl)}`
        : finalRedirect;
      
      navigate(url, { replace: true });
    }
  }, [
    authState,
    isLoading,
    requireAuth,
    requireOnboarding,
    redirectTo,
    redirectIfAuthenticated,
    authenticatedRedirect,
    navigate,
    location.pathname,
  ]);

  // Show loading state
  if (isLoading) {
    return loadingComponent ? <>{loadingComponent}</> : <DefaultLoader />;
  }

  // Show loading during redirect
  if (redirectIfAuthenticated) {
    if (
      authState === "ready" ||
      authState === "needs_onboarding"
    ) {
      return loadingComponent ? <>{loadingComponent}</> : <DefaultLoader />;
    }
  } else {
    const needsRedirect = getRedirectPath(
      authState,
      requireAuth,
      requireOnboarding
    );
    if (needsRedirect) {
      return loadingComponent ? <>{loadingComponent}</> : <DefaultLoader />;
    }
  }

  // Render children
  return <>{children}</>;
}

/**
 * Simple wrapper for public routes that should redirect authenticated users
 * Useful for auth pages
 */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      redirectIfAuthenticated={true}
      authenticatedRedirect="/app"
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Wrapper for routes that require full auth + onboarding
 */
export function AppRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} requireOnboarding={true}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Wrapper for routes that require auth but not onboarding (like /join)
 */
export function AuthRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} requireOnboarding={false}>
      {children}
    </ProtectedRoute>
  );
}


