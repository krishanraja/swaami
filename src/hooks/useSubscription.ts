import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type SubscriptionPlan = "free" | "swaami_plus";

export interface SubscriptionState {
  plan: SubscriptionPlan;
  subscribed: boolean;
  subscriptionEnd: string | null;
  postsUsedThisMonth: number;
  loading: boolean;
  error: string | null;
}

// Free tier limits
export const FREE_LIMITS = {
  postsPerMonth: 3,
  maxRadius: 500,
};

// Swaami+ limits
export const PLUS_LIMITS = {
  postsPerMonth: Infinity,
  maxRadius: 2000,
};

export function useSubscription() {
  const { user, authState, isLoading } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    plan: "free",
    subscribed: false,
    subscriptionEnd: null,
    postsUsedThisMonth: 0,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    // Wait for auth state to resolve before checking user
    if (isLoading || authState === "loading") {
      return;
    }
    
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Get local subscription data
      const { data: localSub } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Check with Stripe for latest status
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;

      const postsUsed = localSub?.posts_used_this_month ?? 0;

      setState({
        plan: data.plan as SubscriptionPlan,
        subscribed: data.subscribed,
        subscriptionEnd: data.subscription_end,
        postsUsedThisMonth: postsUsed,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to check subscription",
      }));
    }
  }, [user, authState, isLoading]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const startCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error starting checkout:", err);
      throw err;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error opening customer portal:", err);
      throw err;
    }
  };

  const incrementPostCount = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("user_subscriptions")
      .update({ 
        posts_used_this_month: state.postsUsedThisMonth + 1 
      })
      .eq("user_id", user.id);

    if (!error) {
      setState(prev => ({
        ...prev,
        postsUsedThisMonth: prev.postsUsedThisMonth + 1,
      }));
    }
  };

  const limits = state.plan === "swaami_plus" ? PLUS_LIMITS : FREE_LIMITS;
  const postsRemaining = Math.max(0, limits.postsPerMonth - state.postsUsedThisMonth);
  const canPost = state.plan === "swaami_plus" || postsRemaining > 0;

  return {
    ...state,
    limits,
    postsRemaining,
    canPost,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
    incrementPostCount,
  };
}
