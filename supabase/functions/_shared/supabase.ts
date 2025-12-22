/**
 * Shared Supabase client utilities for edge functions
 * Standardizes client creation and error handling across all functions
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export interface SupabaseClientOptions {
  useServiceRole?: boolean;
  persistSession?: boolean;
}

/**
 * Creates a Supabase client for edge functions
 * @param options - Configuration options
 * @returns Configured Supabase client
 * @throws Error if required environment variables are missing
 */
export function createSupabaseClient(
  options: SupabaseClientOptions = {}
): SupabaseClient {
  const { useServiceRole = false, persistSession = false } = options;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL environment variable");
  }

  const key = useServiceRole
    ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    : Deno.env.get("SUPABASE_ANON_KEY");

  if (!key) {
    const keyType = useServiceRole ? "SUPABASE_SERVICE_ROLE_KEY" : "SUPABASE_ANON_KEY";
    throw new Error(`Missing ${keyType} environment variable`);
  }

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession,
      autoRefreshToken: false,
    },
  });
}

/**
 * Allowed origins for CORS
 * In production, this should be set via ALLOWED_ORIGINS environment variable
 * Format: comma-separated list of origins (e.g., "https://swaami.app,https://www.swaami.app")
 */
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "https://swaami.app,http://localhost:5173,http://localhost:3000").split(",");

/**
 * Get CORS headers for a specific request
 * Validates origin against allowlist and returns appropriate headers
 */
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  // Default to first allowed origin if no origin header (for non-browser requests)
  const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin) 
    ? requestOrigin 
    : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
  };
}

/**
 * Standard CORS headers for edge functions
 * @deprecated Use getCorsHeaders(req.headers.get("origin")) for proper origin validation
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS")?.split(",")[0] || "https://swaami.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

/**
 * Extracts user from Authorization header
 * @param supabase - Supabase client
 * @param authHeader - Authorization header value
 * @returns User object
 * @throws Error if authentication fails
 */
export async function getUserFromHeader(
  supabase: SupabaseClient,
  authHeader: string | null
) {
  if (!authHeader) {
    throw new Error("No authorization header provided");
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError) {
    throw new Error(`Authentication error: ${userError.message}`);
  }

  if (!userData.user) {
    throw new Error("User not authenticated");
  }

  return userData.user;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  status: number = 500,
  corsHeaders: Record<string, string> = {}
): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new Response(JSON.stringify({ error: errorMessage }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
  data: unknown,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}







