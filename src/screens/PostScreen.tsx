import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import swaamiLogo from "@/assets/swaami-logo.png";

interface AIRewrite {
  title: string;
  description: string;
  time_estimate: string;
  category: string;
  urgency: string;
}

export function PostScreen() {
  const { createTask } = useTasks();
  const [input, setInput] = useState("");
  const [aiRewrite, setAiRewrite] = useState<AIRewrite | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "rewrite-need",
        {
          body: { description: input, type: "rewrite" },
        }
      );

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setAiRewrite(data.result);
    } catch (err: any) {
      console.error("AI rewrite error:", err);
      // Fallback to simple formatting
      setAiRewrite({
        title: input.slice(0, 50),
        description: input,
        time_estimate: "15-20 mins",
        category: "other",
        urgency: "normal",
      });
      setError("AI enhancement unavailable, using your original text.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!aiRewrite) return;

    const { error: createError } = await createTask({
      title: aiRewrite.title,
      description: aiRewrite.description,
      original_description: input,
      time_estimate: aiRewrite.time_estimate,
      category: aiRewrite.category,
      urgency: aiRewrite.urgency,
    });

    if (createError) {
      toast.error("Couldn't post your need", {
        description: createError.message,
      });
      return;
    }

    setIsConfirmed(true);
    toast.success("Your need is now live!", {
      description: "Neighbours nearby will see your request",
    });

    // Reset after animation
    setTimeout(() => {
      setInput("");
      setAiRewrite(null);
      setIsConfirmed(false);
      setError(null);
    }, 2000);
  };

  const handleEdit = () => {
    setAiRewrite(null);
    setError(null);
  };

  const urgencyColors: Record<string, string> = {
    urgent: "bg-destructive/10 text-destructive",
    normal: "bg-primary/10 text-primary-foreground",
    flexible: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 py-4 max-w-lg mx-auto">
          <img src={swaamiLogo} alt="Swaami" className="h-16 w-auto" />
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold text-foreground mb-1">
          Ask for help
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Describe what you need, AI will make it clear
        </p>

        {!aiRewrite && !isConfirmed && (
          <div className="animate-fade-in space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="e.g., Need someone to help me carry groceries upstairs, can't do heavy lifting today..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[140px] text-base resize-none"
              />
              <p className="text-xs text-muted-foreground">
                💡 Tip: Include what you need, when, and any important details
              </p>
            </div>
            <Button
              variant="swaami"
              size="xl"
              className="w-full"
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  AI is enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Enhance with AI
                </>
              )}
            </Button>
          </div>
        )}

        {aiRewrite && !isConfirmed && (
          <div className="animate-slide-up space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>AI-enhanced preview</span>
              </div>

              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {aiRewrite.title}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {aiRewrite.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  ⏱ {aiRewrite.time_estimate}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                  📁 {aiRewrite.category}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full capitalize ${
                    urgencyColors[aiRewrite.urgency]
                  }`}
                >
                  {aiRewrite.urgency === "urgent" ? "🔥" : "📌"}{" "}
                  {aiRewrite.urgency}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="swaami-outline"
                size="lg"
                className="flex-1"
                onClick={handleEdit}
              >
                Edit
              </Button>
              <Button
                variant="swaami"
                size="lg"
                className="flex-1"
                onClick={handleConfirm}
              >
                <Check className="w-5 h-5" />
                Post Need
              </Button>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="animate-slide-up text-center py-12">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Posted!</h3>
            <p className="text-muted-foreground text-sm">
              Your neighbours will see this shortly
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
