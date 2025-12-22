import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useVerificationPolling } from "@/hooks/useAuthSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import swaamiIcon from "@/assets/swaami-icon.png";

// Google icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * Auth page for login/signup
 * Note: Redirects for authenticated users are handled by PublicOnlyRoute in App.tsx
 * This page shows:
 * - Login/Signup forms for anonymous users
 * - Email verification prompt for awaiting_verification state
 * - Session expired message when coming from expired session
 */
export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authState } = useAuthContext();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const isSubmittingRef = useRef(false);
  const hashProcessedRef = useRef(false);
  
  // Check for session expired flag in URL
  const sessionExpired = searchParams.get("expired") === "true";

  // Set mode from URL params
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") setIsLogin(false);
    if (mode === "login") setIsLogin(true);
  }, [searchParams]);

  // Handle email verification callback from Supabase (hash fragments)
  // This processes the token when user clicks verification link
  useEffect(() => {
    // Only process once
    if (hashProcessedRef.current) return;
    
    // Check for hash fragments (Supabase sends verification tokens in hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");
    const error = hashParams.get("error");
    const errorDescription = hashParams.get("error_description");
    
    // Handle verification errors
    if (error) {
      hashProcessedRef.current = true;
      console.error("Verification error:", error, errorDescription);
      toast.error(errorDescription || "Verification link is invalid or expired. Please request a new one.");
      // Clear hash from URL
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }
    
    // If we have a verification token, Supabase will process it automatically
    if (accessToken && (type === "signup" || type === "recovery" || type === "magiclink")) {
      hashProcessedRef.current = true;
      // Clear hash from URL immediately to prevent double processing
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      // Supabase client will automatically process the token via onAuthStateChange
      // AuthContext will update and PublicOnlyRoute will redirect
    }
  }, []);

  // Show email sent screen for awaiting_verification state
  useEffect(() => {
    if (authState.status === "awaiting_verification" && authState.user?.email) {
      setEmail(authState.user.email);
      setEmailSent(true);
    }
  }, [authState.status, authState.user?.email]);

  // Poll for verification status (when user might verify on different device)
  useVerificationPolling(emailSent && authState.status === "awaiting_verification", 5000);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }
    
    // Prevent double submit
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/join`,
        },
      });
      
      if (error) throw error;
      
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      console.error("Resend verification error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to resend verification email";
      toast.error(errorMessage);
    } finally {
      setResending(false);
      isSubmittingRef.current = false;
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/join`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submit
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    hasNavigatedRef.current = false; // Reset navigation flag on new submit

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Check if email is confirmed (only for email/password users)
        const isOAuthUser = data.user?.app_metadata?.provider !== 'email';
        if (!isOAuthUser && !data.user?.email_confirmed_at) {
          toast.error("Please confirm your email before signing in.");
          setLoading(false);
          return;
        }
        
        toast.success("Welcome back!");
        // Navigation will be handled by the useEffect watching auth state
      } else {
        // Signup flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/join`,
            data: {
              display_name: displayName,
            },
          },
        });
        if (error) throw error;
        
        // Check if email confirmation is required
        // In some Supabase configurations, email confirmation might be disabled
        if (data.user && !data.user.email_confirmed_at) {
          // Show email confirmation message
          setEmailSent(true);
          toast.success("Verification email sent! Please check your inbox.");
        } else {
          // Email confirmation not required or already confirmed
          toast.success("Account created! Welcome to Swaami.");
          // Navigation will be handled by the useEffect watching auth state
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("already registered")) {
        toast.error("This email is already registered. Try logging in.");
      } else if (errorMessage.includes("Invalid login")) {
        toast.error("Invalid email or password.");
      } else {
        toast.error(errorMessage || "Authentication failed");
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Email confirmation sent screen
  if (emailSent) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col gap-6 text-center">
          <div className="mx-auto p-4 rounded-full bg-accent/20">
            <Mail className="h-12 w-12 text-accent" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Check your email
            </h1>
            <p className="text-muted-foreground">
              We've sent a verification link to:
            </p>
            <p className="font-medium text-foreground mt-1">{email}</p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
            <p className="mb-3">Click the link in the email to verify your account and continue setting up your profile.</p>
            <p className="text-xs">Didn't receive the email? Check your spam folder or try resending.</p>
          </div>
          
          {/* Polling indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Waiting for verification...</span>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full"
            >
              {resending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                setEmailSent(false);
                setIsLogin(true);
              }}
              className="mx-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Session expired banner */}
        {sessionExpired && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Session expired</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Your session has expired. Please sign in again to continue.
              </p>
            </div>
          </div>
        )}
        
        <div className="text-center">
          <img src={swaamiIcon} alt="Swaami" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? "Welcome back" : "Join Swaami"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLogin ? "Sign in to help your neighbors" : "Start helping your community"}
          </p>
        </div>

        {/* Google Sign-In Button - disabled until backend OAuth is configured */}
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="w-full relative opacity-50"
          disabled={true}
          title="Coming soon"
        >
          <GoogleIcon className="h-5 w-5 mr-2" />
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="How should we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            variant="swaami"
            size="xl"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
