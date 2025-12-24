/**
 * Session Expired Modal
 * 
 * Shows when user's session expires during app usage.
 * Offers options to:
 * 1. Sign in again (preserves current page for return)
 * 2. Continue browsing (limited functionality)
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogIn, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SessionExpiredModalProps {
  isOpen: boolean;
  onDismiss?: () => void;
}

export function SessionExpiredModal({ isOpen, onDismiss }: SessionExpiredModalProps) {
  const navigate = useNavigate();
  const { refreshSession, session } = useAuth();
  
  if (!isOpen) return null;

  const handleSignIn = () => {
    // Store current location for return after sign in
    const currentPath = window.location.pathname;
    if (currentPath !== "/" && currentPath !== "/auth") {
      try {
        sessionStorage.setItem("swaami_return_path", currentPath);
      } catch {
        // sessionStorage might be blocked
      }
    }
    navigate("/auth?mode=login&expired=true");
  };

  const handleRetry = async () => {
    const success = await refreshSession();
    if (success) {
      // Session refreshed successfully, modal will close
      onDismiss?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Session Expired
          </h2>
          <p className="text-sm text-muted-foreground">
            Your session has expired for security. Please sign in again to continue.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="swaami"
            size="lg"
            className="w-full"
            onClick={handleSignIn}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In Again
          </Button>
          
          {session && (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try to Reconnect
            </Button>
          )}
        </div>

        {/* Dismiss option */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue browsing (limited access)
          </button>
        )}
      </div>
    </div>
  );
}


