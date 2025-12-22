import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createSupabaseClient,
  corsHeaders,
  getUserFromHeader,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/supabase.ts";

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
    const supabase = createSupabaseClient({ useServiceRole: true });
    log(requestId, "DEBUG", "SUPABASE_INIT", { initialized: true });

    // Auth check
    const authHeader = req.headers.get('Authorization');
    let user;
    try {
      user = await getUserFromHeader(supabase, authHeader);
    } catch (authError) {
      log(requestId, "WARN", "AUTH_INVALID", { 
        error: authError instanceof Error ? authError.message : "Authentication failed",
      });
      return createErrorResponse(new Error('Invalid token'), 401, corsHeaders);
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
        return createErrorResponse(
          new Error('You must be Tier 1 or higher to endorse others'),
          403,
          corsHeaders
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
        return createErrorResponse(
          new Error('You have reached the maximum of 5 endorsements'),
          403,
          corsHeaders
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
        return createErrorResponse(
          new Error('Failed to create endorsement'),
          500,
          corsHeaders
        );
      }

      const endorsementLink = `${req.headers.get('origin') || 'https://swaami.app'}/endorse/${newToken}`;
      
      const duration = Date.now() - startTime;
      log(requestId, "INFO", "GENERATE_SUCCESS", {
        endorsementId: endorsement.id,
        expiresAt,
        durationMs: duration,
      });

      return createSuccessResponse(
        { success: true, token: newToken, link: endorsementLink },
        corsHeaders
      );
    }

    // ========================================================================
    // ACTION: ACCEPT ENDORSEMENT
    // ========================================================================
    if (action === 'accept') {
      log(requestId, "INFO", "ACTION_ACCEPT_START", { userId: user.id, hasToken: !!endorsementToken });

      if (!endorsementToken) {
        log(requestId, "WARN", "MISSING_TOKEN", { error: "Token required" });
        return createErrorResponse(new Error('Token required'), 400, corsHeaders);
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
        return createErrorResponse(
          new Error('This endorsement has already been used'),
          400,
          corsHeaders
        );
      }

      if (new Date(endorsement.expires_at) < new Date()) {
        log(requestId, "WARN", "ENDORSEMENT_EXPIRED", { expiresAt: endorsement.expires_at });
        return createErrorResponse(
          new Error('This endorsement has expired'),
          400,
          corsHeaders
        );
      }

      if (endorsement.endorser_id === user.id) {
        log(requestId, "WARN", "SELF_ENDORSEMENT", { userId: user.id });
        return createErrorResponse(
          new Error('You cannot endorse yourself'),
          400,
          corsHeaders
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
        return createErrorResponse(
          new Error('You already have an endorsement'),
          400,
          corsHeaders
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
        return createErrorResponse(
          new Error('Failed to accept endorsement'),
          500,
          corsHeaders
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

      return createSuccessResponse({ success: true }, corsHeaders);
    }

    // Invalid action
    log(requestId, "WARN", "INVALID_ACTION", { action });
    return createErrorResponse(new Error('Invalid action'), 400, corsHeaders);

  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;

    log(requestId, "ERROR", "REQUEST_ERROR", {
      error: message,
      stack: stack?.slice(0, 300),
      durationMs: duration,
    });

    return createErrorResponse(new Error('Internal server error'), 500, corsHeaders);
  }
});
