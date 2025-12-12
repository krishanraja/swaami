import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, token: endorsementToken } = await req.json();
    console.log(`[manage-endorsement] Action: ${action}, User: ${user.id}`);

    if (action === 'generate') {
      // Check if user is Tier 1+
      const { data: profile } = await supabase
        .from('profiles')
        .select('trust_tier')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.trust_tier === 'tier_0') {
        return new Response(
          JSON.stringify({ error: 'You must be Tier 1 or higher to endorse others' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check endorsement count (max 5)
      const { count } = await supabase
        .from('endorsements')
        .select('*', { count: 'exact', head: true })
        .eq('endorser_id', user.id)
        .eq('status', 'accepted');

      if (count && count >= 5) {
        return new Response(
          JSON.stringify({ error: 'You have reached the maximum of 5 endorsements' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique token
      const newToken = crypto.randomUUID();
      
      const { data: endorsement, error } = await supabase
        .from('endorsements')
        .insert({
          endorser_id: user.id,
          token: newToken,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[manage-endorsement] Insert error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create endorsement' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const endorsementLink = `${req.headers.get('origin') || 'https://swaami.app'}/endorse/${newToken}`;
      
      return new Response(
        JSON.stringify({ success: true, token: newToken, link: endorsementLink }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'accept') {
      if (!endorsementToken) {
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

      if (findError || !endorsement) {
        return new Response(
          JSON.stringify({ error: 'Invalid endorsement link' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (endorsement.status !== 'pending') {
        return new Response(
          JSON.stringify({ error: 'This endorsement has already been used' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (new Date(endorsement.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'This endorsement has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (endorsement.endorser_id === user.id) {
        return new Response(
          JSON.stringify({ error: 'You cannot endorse yourself' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user already has an endorsement
      const { data: existingVerification } = await supabase
        .from('user_verifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('verification_type', 'endorsement')
        .single();

      if (existingVerification) {
        return new Response(
          JSON.stringify({ error: 'You already have an endorsement' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
        console.error('[manage-endorsement] Update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to accept endorsement' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add verification record
      await supabase
        .from('user_verifications')
        .insert({
          user_id: user.id,
          verification_type: 'endorsement',
          metadata: { endorser_id: endorsement.endorser_id }
        });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[manage-endorsement] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
