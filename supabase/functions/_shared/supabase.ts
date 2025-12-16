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
 * Standard CORS headers for edge functions
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
