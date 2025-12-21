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
  const loadingSetRef = useRef(false);

  useEffect(() => {
    const updateAuthState = (newSession: Session | null, source: string, event?: string) => {
      const newUserId = newSession?.user?.id ?? null;
      const newUser = newSession?.user ?? null;
      
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:updateAuthState',message:'Auth state update called',data:{source,event,newUserId,currentUserId:currentUserIdRef.current,willUpdate:newUserId!==currentUserIdRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      
      // Only update state if user ID actually changed (not just object reference)
      if (newUserId !== currentUserIdRef.current) {
        currentUserIdRef.current = newUserId;
        setUser(newUser);
        setSession(newSession);
      }
      // Only set loading to false once
      if (!loadingSetRef.current) {
        loadingSetRef.current = true;
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        updateAuthState(session, 'onAuthStateChange', event);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session, 'getSession');
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
