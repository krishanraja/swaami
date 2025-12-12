import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
}

// Simple in-memory OTP store (in production, use Redis or DB)
const otpStore = new Map<string, { code: string; expiresAt: number; channel: string }>();

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
    const body: OtpRequest = await req.json();
    const { phone, action, channel = "sms", code } = body;

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
      return new Response(
        JSON.stringify({ error: "Invalid phone format. Use E.164 format (e.g., +61400123456)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

      // Generate and store OTP with channel info
      const otp = generateOtp();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
      
      otpStore.set(phone, { code: otp, expiresAt, channel });
      
      log(requestId, "DEBUG", "OTP_GENERATED", {
        expiresInSeconds: 300,
        storeSize: otpStore.size,
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
        otpStore.delete(phone);

        return new Response(
          JSON.stringify({ error: sendResult.error || `Failed to send ${channel} message` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const duration = Date.now() - startTime;
      log(requestId, "INFO", "SEND_SUCCESS", {
        phone: maskPhone(phone),
        channel,
        durationMs: duration,
      });
      
      return new Response(
        JSON.stringify({ success: true, message: `OTP sent via ${channel.toUpperCase()}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        return new Response(
          JSON.stringify({ error: "OTP code required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const stored = otpStore.get(phone);
      
      if (!stored) {
        log(requestId, "WARN", "VERIFY_NO_OTP", { phone: maskPhone(phone) });
        return new Response(
          JSON.stringify({ error: "No OTP found for this number. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      log(requestId, "DEBUG", "OTP_LOOKUP", {
        found: true,
        channel: stored.channel,
        expired: Date.now() > stored.expiresAt,
      });

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(phone);
        log(requestId, "WARN", "VERIFY_EXPIRED", { phone: maskPhone(phone) });
        return new Response(
          JSON.stringify({ error: "OTP expired. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (stored.code !== code) {
        log(requestId, "WARN", "VERIFY_MISMATCH", { phone: maskPhone(phone) });
        return new Response(
          JSON.stringify({ error: "Invalid OTP code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // OTP verified successfully - return which channel was used
      const verifiedChannel = stored.channel;
      otpStore.delete(phone);

      const duration = Date.now() - startTime;
      log(requestId, "INFO", "VERIFY_SUCCESS", {
        phone: maskPhone(phone),
        channel: verifiedChannel,
        durationMs: duration,
      });

      return new Response(
        JSON.stringify({ success: true, verified: true, channel: verifiedChannel }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invalid action
    log(requestId, "WARN", "INVALID_ACTION", { action });
    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    return new Response(
      JSON.stringify({ error: message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
