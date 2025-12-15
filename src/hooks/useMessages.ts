import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { retrySupabaseOperation } from "@/lib/retry";

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    display_name: string | null;
  };
}

export function useMessages(matchId: string | null) {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  // Double-submission protection for sendMessage
  const sendingRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!matchId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(display_name)
      `)
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    fetchMessages();

    if (!matchId) return;

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          // Fetch the new message with sender info
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!profile || !matchId) return { error: new Error("Missing data") };

    // Double-submission protection
    if (sendingRef.current) {
      return { error: new Error("Message sending already in progress") };
    }

    sendingRef.current = true;

    try {
      // Use retry logic for reliability
      const result = await retrySupabaseOperation(async () => {
        return await supabase
          .from("messages")
          .insert({
            match_id: matchId,
            sender_id: profile.id,
            content,
          })
          .select()
          .single();
      }, {
        maxAttempts: 3,
        initialDelayMs: 200,
      });

      return result;
    } finally {
      sendingRef.current = false;
    }
  };

  return { messages, loading, sendMessage, fetchMessages };
}
