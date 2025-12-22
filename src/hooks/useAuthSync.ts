/**
 * Auth Sync Hook
 * 
 * Handles cross-tab/cross-device auth state synchronization:
 * 1. Detects when user signs in/out on another tab
 * 2. Detects email verification completed on another device
 * 3. Syncs auth state across tabs using storage events
 */

import { useEffect, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

interface AuthSyncOptions {
  /** Called when sign in is detected on another tab */
  onSignInDetected?: () => void;
  /** Called when sign out is detected on another tab */
  onSignOutDetected?: () => void;
  /** Called when verification is detected on another device */
  onVerificationDetected?: () => void;
}

const AUTH_SYNC_KEY = "swaami_auth_sync";

export function useAuthSync(options: AuthSyncOptions = {}) {
  const { authState, refreshSession } = useAuthContext();
  const { onSignInDetected, onSignOutDetected, onVerificationDetected } = options;

  // Broadcast auth state changes to other tabs
  const broadcastAuthChange = useCallback((event: "sign_in" | "sign_out" | "verified") => {
    try {
      localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify({
        event,
        timestamp: Date.now(),
        // Add a random ID to ensure the storage event fires even with same event
        id: Math.random().toString(36).slice(2),
      }));
    } catch {
      // localStorage might be blocked
    }
  }, []);

  // Listen for auth changes from other tabs
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key !== AUTH_SYNC_KEY || !e.newValue) return;

      try {
        const data = JSON.parse(e.newValue);
        const isRecent = Date.now() - data.timestamp < 5000; // Within 5 seconds

        if (!isRecent) return;

        switch (data.event) {
          case "sign_in":
            onSignInDetected?.();
            // Refresh our session to sync state
            await refreshSession();
            break;

          case "sign_out":
            onSignOutDetected?.();
            // Force reload to clear all state
            window.location.reload();
            break;

          case "verified":
            onVerificationDetected?.();
            // Refresh session to pick up verified status
            await refreshSession();
            break;
        }
      } catch {
        // Ignore parse errors
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [onSignInDetected, onSignOutDetected, onVerificationDetected, refreshSession]);

  // Broadcast our auth changes
  useEffect(() => {
    // Broadcast when we sign in
    if (authState.status === "ready" || authState.status === "needs_onboarding") {
      broadcastAuthChange("sign_in");
    }
    
    // Broadcast when we sign out
    if (authState.status === "anonymous") {
      broadcastAuthChange("sign_out");
    }
    
    // Broadcast when we get verified
    if (authState.isEmailVerified && authState.user) {
      broadcastAuthChange("verified");
    }
  }, [authState.status, authState.isEmailVerified, authState.user, broadcastAuthChange]);

  return { broadcastAuthChange };
}

/**
 * Poll for verification status
 * Useful when user might verify email on different device
 */
export function useVerificationPolling(enabled: boolean, intervalMs = 5000) {
  const { authState, refreshSession } = useAuthContext();

  useEffect(() => {
    if (!enabled) return;
    if (authState.status !== "awaiting_verification") return;

    const pollInterval = setInterval(async () => {
      // Refresh session to check if email was verified
      await refreshSession();
    }, intervalMs);

    return () => clearInterval(pollInterval);
  }, [enabled, authState.status, intervalMs, refreshSession]);
}


