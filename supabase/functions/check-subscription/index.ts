import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import {
  createSupabaseClient,
  corsHeaders,
  getUserFromHeader,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/supabase.ts";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Swaami+ product ID
const SWAAMI_PLUS_PRODUCT_ID = "prod_TaYxIwz13dAY7m";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createSupabaseClient({
      useServiceRole: true,
      persistSession: false,
    });

    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(supabaseClient, authHeader);
    if (!user?.email) throw new Error("User email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free status");
      return createSuccessResponse({
        subscribed: false,
        plan: "free",
        subscription_end: null,
      }, corsHeaders);
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let plan = "free";
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const productId = subscription.items.data[0].price.product;
      
      if (productId === SWAAMI_PLUS_PRODUCT_ID) {
        plan = "swaami_plus";
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        plan,
        endDate: subscriptionEnd 
      });

      // Update user_subscriptions table
      await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          status: "active",
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: subscriptionEnd,
        }, { onConflict: "user_id" });
    } else {
      logStep("No active subscription found");
    }

    return createSuccessResponse({
      subscribed: hasActiveSub,
      plan,
      subscription_end: subscriptionEnd,
    }, corsHeaders);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return createErrorResponse(error, 500, corsHeaders);
  }
});
