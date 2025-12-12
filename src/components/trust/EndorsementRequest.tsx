import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Share2, Loader2, UserCheck } from "lucide-react";
import { useTrustTier } from "@/hooks/useTrustTier";

interface EndorsementRequestProps {
  onEndorsementReceived?: () => void;
}

export function EndorsementRequest({ onEndorsementReceived }: EndorsementRequestProps) {
  const { user, session } = useAuth();
  const { tier, hasVerification } = useTrustTier();
  const { toast } = useToast();
  const [endorsementLink, setEndorsementLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [givenEndorsements, setGivenEndorsements] = useState(0);

  const canEndorse = tier !== 'tier_0';
  const hasEndorsement = hasVerification('endorsement');

  useEffect(() => {
    if (user && canEndorse) {
      fetchEndorsementCount();
    }
  }, [user, canEndorse]);

  const fetchEndorsementCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('endorsements')
      .select('*', { count: 'exact', head: true })
      .eq('endorser_id', user.id)
      .eq('status', 'accepted');

    setGivenEndorsements(count || 0);
  };

  const generateLink = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-endorsement', {
        body: { action: 'generate' },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setEndorsementLink(data.link);
    } catch (error: any) {
      console.error('Generate link error:', error);
      toast({
        title: "Failed to generate link",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!endorsementLink) return;
    
    try {
      await navigator.clipboard.writeText(endorsementLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share it with someone who can endorse you",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (!endorsementLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Swaami Endorsement',
          text: 'Can you vouch for me on Swaami?',
          url: endorsementLink,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      copyLink();
    }
  };

  // If already has endorsement
  if (hasEndorsement) {
    return (
      <div className="text-center space-y-4 p-6 bg-primary/5 rounded-xl border border-primary/20">
        <div className="w-12 h-12 mx-auto rounded-full bg-primary flex items-center justify-center">
          <UserCheck className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">You've been endorsed!</h3>
          <p className="text-sm text-muted-foreground">
            A verified member has vouched for you
          </p>
        </div>
      </div>
    );
  }

  // Request endorsement (for Tier 0 users)
  if (!canEndorse) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Get endorsed</h3>
          <p className="text-sm text-muted-foreground">
            Ask a verified Swaami member to vouch for you
          </p>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <p className="text-sm">
            To complete your verification, you need an endorsement from someone who is already verified (Tier 1+).
          </p>
          <p className="text-sm text-muted-foreground">
            They can generate an endorsement link for you from their profile.
          </p>
        </div>
      </div>
    );
  }

  // Generate endorsement link (for Tier 1+ users)
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Endorse someone</h3>
        <p className="text-sm text-muted-foreground">
          Help a friend join Swaami ({givenEndorsements}/5 endorsements given)
        </p>
      </div>

      {givenEndorsements >= 5 ? (
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            You've reached the maximum of 5 endorsements
          </p>
        </div>
      ) : endorsementLink ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={endorsementLink}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={copyLink}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button className="w-full" onClick={shareLink}>
            <Share2 className="w-4 h-4 mr-2" />
            Share link
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Link expires in 7 days
          </p>
        </div>
      ) : (
        <Button 
          className="w-full" 
          onClick={generateLink}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <UserCheck className="w-4 h-4 mr-2" />
          )}
          Generate endorsement link
        </Button>
      )}
    </div>
  );
}
