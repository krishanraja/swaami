import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// LOGGING UTILITIES (10/10 Standard)
// ============================================================================

interface LogContext {
  [key: string]: unknown;
}

function log(requestId: string, level: "DEBUG" | "INFO" | "WARN" | "ERROR", message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
  console[level === "ERROR" ? "error" : level === "WARN" ? "warn" : "log"](
    `[${timestamp}] [${requestId}] [${level}] ${message}${contextStr}`
  );
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();

  // CORS preflight
  if (req.method === 'OPTIONS') {
    log(requestId, "DEBUG", "CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  log(requestId, "INFO", "REQUEST_START", {
    method: req.method,
    url: req.url,
  });

  try {
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    log(requestId, "DEBUG", "SUPABASE_INIT", { hasUrl: !!supabaseUrl, hasKey: !!supabaseServiceKey });

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      log(requestId, "WARN", "AUTH_MISSING", { error: "No authorization header" });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      log(requestId, "WARN", "AUTH_INVALID", { 
        error: userError?.message ?? "No user found",
        hasToken: !!token,
      });
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log(requestId, "INFO", "AUTH_SUCCESS", { userId: user.id, email: user.email?.slice(0, 3) + "***" });

    // Parse request
    const { action, token: endorsementToken } = await req.json();
    
    log(requestId, "INFO", "REQUEST_PARSED", {
      action,
      hasToken: !!endorsementToken,
      userId: user.id,
    });

    // ========================================================================
    // ACTION: GENERATE ENDORSEMENT LINK
    // ========================================================================
    if (action === 'generate') {
      log(requestId, "INFO", "ACTION_GENERATE_START", { userId: user.id });

      // Check if user is Tier 1+
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('trust_tier, display_name')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        log(requestId, "ERROR", "DB_PROFILE_ERROR", { error: profileError.message });
      }

      log(requestId, "DEBUG", "PROFILE_FETCHED", {
        hasTier: !!profile?.trust_tier,
        tier: profile?.trust_tier,
      });

      if (!profile || profile.trust_tier === 'tier_0') {
        log(requestId, "WARN", "TIER_CHECK_FAILED", { 
          tier: profile?.trust_tier ?? "none",
          required: "tier_1+",
        });
        return new Response(
          JSON.stringify({ error: 'You must be Tier 1 or higher to endorse others' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check endorsement count (max 5)
      const { count, error: countError } = await supabase
        .from('endorsements')
        .select('*', { count: 'exact', head: true })
        .eq('endorser_id', user.id)
        .eq('status', 'accepted');

      if (countError) {
        log(requestId, "ERROR", "DB_COUNT_ERROR", { error: countError.message });
      }

      log(requestId, "DEBUG", "ENDORSEMENT_COUNT", { count: count ?? 0, max: 5 });

      if (count && count >= 5) {
        log(requestId, "WARN", "ENDORSEMENT_LIMIT", { count, max: 5 });
        return new Response(
          JSON.stringify({ error: 'You have reached the maximum of 5 endorsements' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique token
      const newToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      log(requestId, "INFO", "GENERATING_TOKEN", { expiresAt });
      
      const { data: endorsement, error: insertError } = await supabase
        .from('endorsements')
        .insert({
          endorser_id: user.id,
          token: newToken,
          status: 'pending',
          expires_at: expiresAt
        })
        .select()
        .single();

      if (insertError) {
        log(requestId, "ERROR", "DB_INSERT_ERROR", { error: insertError.message });
        return new Response(
          JSON.stringify({ error: 'Failed to create endorsement' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const endorsementLink = `${req.headers.get('origin') || 'https://swaami.app'}/endorse/${newToken}`;
      
      const duration = Date.now() - startTime;
      log(requestId, "INFO", "GENERATE_SUCCESS", {
        endorsementId: endorsement.id,
        expiresAt,
        durationMs: duration,
      });

      return new Response(
        JSON.stringify({ success: true, token: newToken, link: endorsementLink }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // ACTION: ACCEPT ENDORSEMENT
    // ========================================================================
    if (action === 'accept') {
      log(requestId, "INFO", "ACTION_ACCEPT_START", { userId: user.id, hasToken: !!endorsementToken });

      if (!endorsementToken) {
        log(requestId, "WARN", "MISSING_TOKEN", { error: "Token required" });
        return new Response(
          JSON.stringify({ error: 'Token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find the endorsement
      const { data: endorsement, error: findError } = await supabase
        .from('endorsements')
        .select('*')
        .eq('token', endorsementToken)
        .single();

      if (findError) {
        log(requestId, "DEBUG", "DB_FIND_ERROR", { error: findError.message });
      }

      if (findError || !endorsement) {
        log(requestId, "WARN", "ENDORSEMENT_NOT_FOUND", { token: endorsementToken.slice(0, 8) + "..." });
        return new Response(
          JSON.stringify({ error: 'Invalid endorsement link' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      log(requestId, "DEBUG", "ENDORSEMENT_FOUND", {
        id: endorsement.id,
        status: endorsement.status,
        endorserId: endorsement.endorser_id,
        expiresAt: endorsement.expires_at,
      });

      // Validation checks
      if (endorsement.status !== 'pending') {
        log(requestId, "WARN", "ENDORSEMENT_USED", { status: endorsement.status });
        return new Response(
          JSON.stringify({ error: 'This endorsement has already been used' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (new Date(endorsement.expires_at) < new Date()) {
        log(requestId, "WARN", "ENDORSEMENT_EXPIRED", { expiresAt: endorsement.expires_at });
        return new Response(
          JSON.stringify({ error: 'This endorsement has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (endorsement.endorser_id === user.id) {
        log(requestId, "WARN", "SELF_ENDORSEMENT", { userId: user.id });
        return new Response(
          JSON.stringify({ error: 'You cannot endorse yourself' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user already has an endorsement
      const { data: existingVerification, error: verifyCheckError } = await supabase
        .from('user_verifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('verification_type', 'endorsement')
        .single();

      if (verifyCheckError && verifyCheckError.code !== 'PGRST116') {
        log(requestId, "ERROR", "DB_VERIFY_CHECK_ERROR", { error: verifyCheckError.message });
      }

      if (existingVerification) {
        log(requestId, "WARN", "ALREADY_ENDORSED", { existingId: existingVerification.id });
        return new Response(
          JSON.stringify({ error: 'You already have an endorsement' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      log(requestId, "INFO", "VALIDATION_PASSED", { endorsementId: endorsement.id });

      // Accept the endorsement
      const { error: updateError } = await supabase
        .from('endorsements')
        .update({
          endorsed_id: user.id,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', endorsement.id);

      if (updateError) {
        log(requestId, "ERROR", "DB_UPDATE_ERROR", { error: updateError.message });
        return new Response(
          JSON.stringify({ error: 'Failed to accept endorsement' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      log(requestId, "DEBUG", "ENDORSEMENT_UPDATED", { status: "accepted" });

      // Add verification record
      const { error: verifyInsertError } = await supabase
        .from('user_verifications')
        .insert({
          user_id: user.id,
          verification_type: 'endorsement',
          metadata: { endorser_id: endorsement.endorser_id }
        });

      if (verifyInsertError) {
        log(requestId, "ERROR", "DB_VERIFICATION_INSERT_ERROR", { error: verifyInsertError.message });
        // Don't fail the request, endorsement was accepted
      } else {
        log(requestId, "DEBUG", "VERIFICATION_ADDED", { type: "endorsement" });
      }

      const duration = Date.now() - startTime;
      log(requestId, "INFO", "ACCEPT_SUCCESS", {
        endorsementId: endorsement.id,
        endorserId: endorsement.endorser_id,
        endorsedId: user.id,
        durationMs: duration,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Invalid action
    log(requestId, "WARN", "INVALID_ACTION", { action });
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;

    log(requestId, "ERROR", "REQUEST_ERROR", {
      error: message,
      stack: stack?.slice(0, 300),
      durationMs: duration,
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
