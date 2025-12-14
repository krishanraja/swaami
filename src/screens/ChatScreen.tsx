import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/hooks/useMessages";
import { useMatches } from "@/hooks/useMatches";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeText } from "@/lib/validation";

export function ChatScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { messages, loading: messagesLoading, sendMessage } = useMessages(matchId || null);
  const { matches, loading: matchesLoading, updateMatchStatus } = useMatches();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const match = matches.find((m) => m.id === matchId);
  const isHelper = match?.helper_id === profile?.id;
  const otherPerson = isHelper ? match?.task?.owner : match?.helper;
  const loading = messagesLoading || matchesLoading;

  // Fix dead end: Redirect if matchId invalid or match not found
  useEffect(() => {
    if (!matchId) {
      navigate("/app");
      return;
    }

    // Timeout after 5 seconds if still loading and no match
    const timeout = setTimeout(() => {
      if (!loading && !match && matches.length > 0) {
        toast.error("Chat not found");
        navigate("/app");
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [matchId, loading, match, matches.length, navigate]);

  // Also check after matches load
  useEffect(() => {
    if (!matchesLoading && matches.length > 0 && !match && matchId) {
      toast.error("Chat not found");
      navigate("/app");
    }
  }, [matchesLoading, matches, match, matchId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    // Sanitize message content before sending
    const sanitizedMessage = sanitizeText(newMessage.trim());
    const { error } = await sendMessage(sanitizedMessage);
    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleStatusUpdate = async (status: string) => {
    if (!matchId) return;

    const { error } = await updateMatchStatus(matchId, status);
    if (error) {
      toast.error("Failed to update status");
      return;
    }

    // Only show success if update actually succeeded
    if (status === "arrived") {
      toast.success("You've marked yourself as arrived!");
    } else if (status === "completed") {
      // Update task status and verify it succeeded
      if (match?.task_id) {
        const { error: taskError } = await supabase
          .from("tasks")
          .update({ status: "completed" })
          .eq("id", match.task_id);
        
        if (taskError) {
          toast.error("Failed to complete task");
          return;
        }
      }
      toast.success("Task completed! Great job helping out! 🎉");
    }
  };

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 py-3 max-w-lg mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            {/* Role clarity - show if helping or getting help */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isHelper 
                  ? "bg-accent/10 text-accent" 
                  : "bg-primary/10 text-primary"
              }`}>
                {isHelper ? "Helping with" : "Getting help"}
              </span>
            </div>
            <h1 className="font-semibold text-foreground truncate mt-1">
              {otherPerson?.display_name || "Chat"}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {match.task?.title}
            </p>
          </div>
        </div>
      </header>

      {/* Task Summary Card */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground">
                {match.task?.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {match.task?.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {isHelper && match.status !== "completed" && (
            <div className="flex gap-2 mt-3">
              {match.status === "accepted" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStatusUpdate("arrived")}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  I've Arrived
                </Button>
              )}
              {(match.status === "arrived" || match.status === "accepted") && (
                <Button
                  variant="swaami"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStatusUpdate("completed")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Complete
                </Button>
              )}
            </div>
          )}

          {match.status === "completed" && (
            <div className="mt-3 text-center py-2 bg-accent/10 rounded-lg">
              <span className="text-sm text-accent font-medium">
                ✨ Task Completed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs mt-1">Say hi to get started!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === profile?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            aria-label="Message input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            variant="swaami"
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            aria-label={sending ? "Sending message" : "Send message"}
          >
            {sending ? (
              <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
