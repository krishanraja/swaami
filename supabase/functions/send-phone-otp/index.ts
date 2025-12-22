import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  createSupabaseClient,
  corsHeaders,
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

function maskPhone(phone: string): string {
  if (phone.length < 6) return "***";
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

// ============================================================================
// TYPES
// ============================================================================

interface OtpRequest {
  phone: string;
  action: "send" | "verify";
  channel?: "sms" | "whatsapp";
  code?: string;
  otp?: string; // Also accept 'otp' as alias for 'code'
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseClient() {
  return createSupabaseClient({ useServiceRole: true });
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendViaTwilio(
  phone: string, 
  message: string, 
  channel: "sms" | "whatsapp",
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  log(requestId, "DEBUG", "TWILIO_CONFIG_CHECK", {
    hasAccountSid: !!accountSid,
    hasAuthToken: !!authToken,
    hasFromNumber: !!fromNumber,
    fromNumberPrefix: fromNumber?.slice(0, 4) ?? "N/A",
  });

  if (!accountSid || !authToken || !fromNumber) {
    log(requestId, "ERROR", "TWILIO_CONFIG_MISSING", {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasFromNumber: !!fromNumber,
    });
    return { success: false, error: "Messaging service not configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = btoa(`${accountSid}:${authToken}`);

  // For WhatsApp, prefix both To and From with "whatsapp:"
  const toNumber = channel === "whatsapp" ? `whatsapp:${phone}` : phone;
  const fromAddr = channel === "whatsapp" ? `whatsapp:${fromNumber}` : fromNumber;

  log(requestId, "INFO", "TWILIO_SEND_START", {
    channel,
    to: maskPhone(phone),
    fromPrefix: fromAddr.slice(0, 12),
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: toNumber,
        From: fromAddr,
        Body: message,
      }),
    });

    const responseText = await response.text();

    log(requestId, "DEBUG", "TWILIO_RESPONSE", {
      status: response.status,
      ok: response.ok,
      bodyPreview: responseText.slice(0, 200),
    });

    if (!response.ok) {
      // Try to parse Twilio error
      let twilioError = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        twilioError = `Twilio error ${errorJson.code}: ${errorJson.message}`;
        
        log(requestId, "ERROR", "TWILIO_API_ERROR", {
          code: errorJson.code,
          message: errorJson.message,
          moreInfo: errorJson.more_info,
        });
      } catch {
        log(requestId, "ERROR", "TWILIO_API_ERROR", { rawError: responseText.slice(0, 200) });
      }
      
      return { success: false, error: twilioError };
    }

    log(requestId, "INFO", "TWILIO_SEND_SUCCESS", {
      channel,
      to: maskPhone(phone),
    });

    return { success: true };

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Twilio error";
    log(requestId, "ERROR", "TWILIO_EXCEPTION", { error: message });
    return { success: false, error: message };
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();

  // CORS preflight
  if (req.method === "OPTIONS") {
    log(requestId, "DEBUG", "CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  log(requestId, "INFO", "REQUEST_START", {
    method: req.method,
    url: req.url,
  });

  try {
    const supabase = getSupabaseClient();
    const body: OtpRequest = await req.json();
    const { phone, action, channel = "sms" } = body;
    // Accept both 'code' and 'otp' fields
    const code = body.code || body.otp;

    log(requestId, "INFO", "REQUEST_PARSED", {
      action,
      channel,
      phone: maskPhone(phone || ""),
      hasCode: !!code,
    });

    // Validate phone format
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phone)) {
      log(requestId, "WARN", "PHONE_VALIDATION_FAILED", {
        phone: maskPhone(phone || ""),
        error: "Invalid E.164 format",
      });
      return createErrorResponse(
        new Error("Invalid phone format. Use E.164 format (e.g., +61400123456)"),
        400,
        corsHeaders
      );
    }

    log(requestId, "DEBUG", "PHONE_VALIDATED", { format: "E.164" });

    // ========================================================================
    // ACTION: SEND OTP
    // ========================================================================
    if (action === "send") {
      log(requestId, "INFO", "ACTION_SEND_START", {
        phone: maskPhone(phone),
        channel,
      });

      // Generate OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes expiry
      
      // Delete any existing OTPs for this phone first
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('phone', phone);
      
      // Store OTP in database
      const { error: insertError } = await supabase
        .from('otp_verifications')
        .insert({
          phone,
          code: otp,
          channel,
          expires_at: expiresAt,
        });

      if (insertError) {
        log(requestId, "ERROR", "OTP_STORE_FAILED", { error: insertError.message });
        return createErrorResponse(
          new Error("Failed to generate verification code"),
          500,
          corsHeaders
        );
      }
      
      log(requestId, "DEBUG", "OTP_STORED", {
        expiresAt,
        channel,
      });

      // Send via selected channel
      const message = `Your Swaami verification code is: ${otp}. Valid for 5 minutes.`;
      const sendResult = await sendViaTwilio(phone, message, channel, requestId);

      if (!sendResult.success) {
        log(requestId, "ERROR", "SEND_FAILED", {
          phone: maskPhone(phone),
          channel,
          error: sendResult.error,
        });

        // Clean up stored OTP on failure
        await supabase
          .from('otp_verifications')
          .delete()
          .eq('phone', phone);

        return createErrorResponse(
          new Error(sendResult.error || `Failed to send ${channel} message`),
          500,
          corsHeaders
        );
      }

      const duration = Date.now() - startTime;
      log(requestId, "INFO", "SEND_SUCCESS", {
        phone: maskPhone(phone),
        channel,
        durationMs: duration,
      });
      
      return createSuccessResponse(
        { success: true, message: `OTP sent via ${channel.toUpperCase()}` },
        corsHeaders
      );
    }

    // ========================================================================
    // ACTION: VERIFY OTP
    // ========================================================================
    if (action === "verify") {
      log(requestId, "INFO", "ACTION_VERIFY_START", {
        phone: maskPhone(phone),
        hasCode: !!code,
      });

      if (!code) {
        log(requestId, "WARN", "VERIFY_MISSING_CODE");
        return createErrorResponse(
          new Error("OTP code required"),
          400,
          corsHeaders
        );
      }

      // Look up OTP from database
      const { data: stored, error: lookupError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (lookupError || !stored) {
        log(requestId, "WARN", "VERIFY_NO_OTP", { phone: maskPhone(phone), error: lookupError?.message });
        return createErrorResponse(
          new Error("No OTP found for this number. Please request a new code."),
          400,
          corsHeaders
        );
      }

      log(requestId, "DEBUG", "OTP_LOOKUP", {
        found: true,
        channel: stored.channel,
        expired: new Date() > new Date(stored.expires_at),
      });

      if (new Date() > new Date(stored.expires_at)) {
        // Delete expired OTP
        await supabase
          .from('otp_verifications')
          .delete()
          .eq('id', stored.id);
        
        log(requestId, "WARN", "VERIFY_EXPIRED", { phone: maskPhone(phone) });
        return createErrorResponse(
          new Error("OTP expired. Please request a new code."),
          400,
          corsHeaders
        );
      }

      if (stored.code !== code) {
        log(requestId, "WARN", "VERIFY_MISMATCH", { phone: maskPhone(phone) });
        return createErrorResponse(
          new Error("Invalid OTP code"),
          400,
          corsHeaders
        );
      }

      // OTP verified successfully - delete it and return channel
      const verifiedChannel = stored.channel;
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', stored.id);

      const duration = Date.now() - startTime;
      log(requestId, "INFO", "VERIFY_SUCCESS", {
        phone: maskPhone(phone),
        channel: verifiedChannel,
        durationMs: duration,
      });

      return createSuccessResponse(
        { success: true, verified: true, channel: verifiedChannel },
        corsHeaders
      );
    }

    // Invalid action
    log(requestId, "WARN", "INVALID_ACTION", { action });
    return createErrorResponse(
      new Error("Invalid action"),
      400,
      corsHeaders
    );

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;

    log(requestId, "ERROR", "REQUEST_ERROR", {
      error: message,
      stack: stack?.slice(0, 300),
      durationMs: duration,
    });

    return createErrorResponse(
      new Error(message || "Internal server error"),
      500,
      corsHeaders
    );
  }
};

serve(handler);