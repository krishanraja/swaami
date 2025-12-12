import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OtpRequest {
  phone: string;
  action: "send" | "verify";
  channel?: "sms" | "whatsapp";
  code?: string;
}

// Simple in-memory OTP store (in production, use Redis or DB)
const otpStore = new Map<string, { code: string; expiresAt: number; channel: string }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendViaTwilio(phone: string, message: string, channel: "sms" | "whatsapp"): Promise<boolean> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Missing Twilio credentials");
    throw new Error("Messaging service not configured");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = btoa(`${accountSid}:${authToken}`);

  // For WhatsApp, prefix both To and From with "whatsapp:"
  const toNumber = channel === "whatsapp" ? `whatsapp:${phone}` : phone;
  const fromAddr = channel === "whatsapp" ? `whatsapp:${fromNumber}` : fromNumber;

  console.log(`Sending ${channel} message to ${toNumber} from ${fromAddr}`);

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

  if (!response.ok) {
    const error = await response.text();
    console.error(`Twilio ${channel} error:`, error);
    throw new Error(`Failed to send ${channel} message`);
  }

  console.log(`${channel.toUpperCase()} sent successfully to ${phone}`);
  return true;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, action, channel = "sms", code }: OtpRequest = await req.json();

    // Validate phone format
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone format. Use E.164 format (e.g., +61400123456)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send") {
      // Generate and store OTP with channel info
      const otp = generateOtp();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
      
      otpStore.set(phone, { code: otp, expiresAt, channel });
      
      // Send via selected channel
      const message = `Your Swaami verification code is: ${otp}. Valid for 5 minutes.`;
      await sendViaTwilio(phone, message, channel);

      console.log(`OTP sent to ${phone} via ${channel}`);
      
      return new Response(
        JSON.stringify({ success: true, message: `OTP sent via ${channel.toUpperCase()}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!code) {
        return new Response(
          JSON.stringify({ error: "OTP code required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const stored = otpStore.get(phone);
      
      if (!stored) {
        return new Response(
          JSON.stringify({ error: "No OTP found for this number. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(phone);
        return new Response(
          JSON.stringify({ error: "OTP expired. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (stored.code !== code) {
        return new Response(
          JSON.stringify({ error: "Invalid OTP code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // OTP verified successfully - return which channel was used
      const verifiedChannel = stored.channel;
      otpStore.delete(phone);
      console.log(`Phone ${phone} verified successfully via ${verifiedChannel}`);

      return new Response(
        JSON.stringify({ success: true, verified: true, channel: verifiedChannel }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-phone-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
