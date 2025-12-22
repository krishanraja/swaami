/**
 * Auth Debug Panel (Development Only)
 * 
 * Shows current auth state, session info, and route guard decisions.
 * Only visible in development mode.
 * 
 * Usage: Add <AuthDebugPanel /> anywhere in your app
 * Toggle with Ctrl+Shift+D or by clicking the button
 */

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuthContext, AuthStatus } from "@/contexts/AuthContext";
import { Bug, X, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

// Only render in development
const IS_DEV = import.meta.env.DEV;

const STATUS_COLORS: Record<AuthStatus, string> = {
  loading: "bg-blue-500",
  anonymous: "bg-gray-500",
  awaiting_verification: "bg-yellow-500",
  signed_in: "bg-orange-500",
  needs_onboarding: "bg-purple-500",
  ready: "bg-green-500",
  session_expired: "bg-red-500",
};

export function AuthDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const { authState, isAuthenticated, canAccessApp } = useAuthContext();

  // Keyboard shortcut to toggle (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Don't render in production
  if (!IS_DEV) return null;

  const copyDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      location: location.pathname,
      authState: {
        status: authState.status,
        userId: authState.user?.id,
        email: authState.user?.email,
        isEmailVerified: authState.isEmailVerified,
        isOnboarded: authState.isOnboarded,
        hasSession: !!authState.session,
        sessionExpiry: authState.session?.expires_at,
      },
      flags: {
        isAuthenticated,
        canAccessApp,
      },
    };

    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 p-2 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        title="Open Auth Debug Panel (Ctrl+Shift+D)"
      >
        <Bug className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-20 right-4 z-50 w-80 bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ${
        isMinimized ? "h-12" : "max-h-[60vh]"
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-gray-800 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4" />
          <span className="text-sm font-medium">Auth Debug</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[authState.status]}`}
          >
            {authState.status}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isMinimized ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3 overflow-y-auto max-h-[calc(60vh-48px)] text-xs space-y-3">
          {/* Current Route */}
          <Section title="Route">
            <code className="text-blue-400">{location.pathname}</code>
          </Section>

          {/* Auth Status */}
          <Section title="Status">
            <div className="space-y-1">
              <Row label="Status" value={authState.status} />
              <Row label="Authenticated" value={isAuthenticated ? "✅" : "❌"} />
              <Row label="Can Access App" value={canAccessApp ? "✅" : "❌"} />
            </div>
          </Section>

          {/* User Info */}
          <Section title="User">
            {authState.user ? (
              <div className="space-y-1">
                <Row label="ID" value={authState.user.id.slice(0, 8) + "..."} />
                <Row label="Email" value={authState.user.email || "none"} />
                <Row
                  label="Email Verified"
                  value={authState.isEmailVerified ? "✅" : "❌"}
                />
                <Row
                  label="Provider"
                  value={authState.user.app_metadata?.provider || "email"}
                />
              </div>
            ) : (
              <span className="text-gray-500">No user</span>
            )}
          </Section>

          {/* Session Info */}
          <Section title="Session">
            {authState.session ? (
              <div className="space-y-1">
                <Row
                  label="Expires"
                  value={new Date(
                    authState.session.expires_at! * 1000
                  ).toLocaleTimeString()}
                />
                <Row
                  label="Token (start)"
                  value={authState.session.access_token.slice(0, 20) + "..."}
                />
              </div>
            ) : (
              <span className="text-gray-500">No session</span>
            )}
          </Section>

          {/* Profile Info */}
          <Section title="Profile">
            {authState.profile ? (
              <div className="space-y-1">
                <Row label="Onboarded" value={authState.isOnboarded ? "✅" : "❌"} />
                <Row label="City" value={authState.profile.city || "none"} />
                <Row
                  label="Neighbourhood"
                  value={authState.profile.neighbourhood || "none"}
                />
                <Row label="Phone" value={authState.profile.phone ? "✅" : "❌"} />
                <Row
                  label="Skills"
                  value={authState.profile.skills?.length?.toString() || "0"}
                />
                <Row
                  label="Trust Tier"
                  value={authState.profile.trust_tier || "none"}
                />
              </div>
            ) : (
              <span className="text-gray-500">No profile</span>
            )}
          </Section>

          {/* Copy Button */}
          <button
            onClick={copyDebugInfo}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Debug Info</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-gray-400 uppercase tracking-wide mb-1">{title}</h4>
      <div className="bg-gray-800 rounded-lg p-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}


