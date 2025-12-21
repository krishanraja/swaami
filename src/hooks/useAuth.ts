import { useState, useEffect, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track current user ID to prevent unnecessary state updates
  // This fixes mobile flickering caused by onAuthStateChange firing repeatedly
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const updateAuthState = (newSession: Session | null) => {
      const newUserId = newSession?.user?.id ?? null;
      const newUser = newSession?.user ?? null;
      
      // Only update state if user ID actually changed (not just object reference)
      if (newUserId !== currentUserIdRef.current) {
        currentUserIdRef.current = newUserId;
        setUser(newUser);
        setSession(newSession);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        updateAuthState(session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
