import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import swaamiIcon from "@/assets/swaami-icon.png";

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode === "signup") setIsLogin(false);
    if (mode === "login") setIsLogin(true);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Check if email is confirmed before proceeding
        if (session.user.email_confirmed_at) {
          navigate("/join");
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && session.user.email_confirmed_at) {
        navigate("/join");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Check if email is confirmed
        if (!data.user?.email_confirmed_at) {
          toast.error("Please confirm your email before signing in.");
          setLoading(false);
          return;
        }
        
        toast.success("Welcome back!");
        navigate("/join");
      } else {
        // Signup flow
        const { error } = await supabase.auth.signUp({
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
        
        // Show email confirmation message
        setEmailSent(true);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.message?.includes("already registered")) {
        toast.error("This email is already registered. Try logging in.");
      } else if (error.message?.includes("Invalid login")) {
        toast.error("Invalid email or password.");
      } else {
        toast.error(error.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
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
            <p>Click the link in the email to verify your account and continue setting up your profile.</p>
          </div>
          
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
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <img src={swaamiIcon} alt="Swaami" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? "Welcome back" : "Join Swaami"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLogin ? "Sign in to help your neighbors" : "Start helping your community"}
          </p>
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
            {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
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
