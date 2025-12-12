import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";
import { Sparkles, Check, AlertCircle, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import { useSubscription, FREE_LIMITS } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { QuickTemplates } from "@/components/QuickTemplates";
import { Confetti } from "@/components/Confetti";
import { HelperPreview } from "@/components/HelperPreview";
import { VoiceInput } from "@/components/VoiceInput";
import { AccessibilitySettings } from "@/components/AccessibilitySettings";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AIRewrite {
  title: string;
  description: string;
  time_estimate: string;
  category: string;
  urgency: string;
}

export function PostScreen() {
  const { createTask } = useTasks();
  const { plan, postsRemaining, canPost, incrementPostCount } = useSubscription();
  const { settings } = useAccessibility();
  const [input, setInput] = useState("");
  const [aiRewrite, setAiRewrite] = useState<AIRewrite | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleTemplateSelect = (text: string) => {
    setInput(text);
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput((prev) => prev + (prev ? " " : "") + transcript);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    // Check post limit for free users
    if (!canPost) {
      setShowUpgrade(true);
      return;
    }

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

    // Increment post count for free users
    if (plan === "free") {
      await incrementPostCount();
    }

    setIsConfirmed(true);
    setShowConfetti(true);
    toast.success("Done! Your request is live.", {
      description: "Neighbours nearby will see it soon",
    });

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
    normal: "bg-muted text-muted-foreground",
    flexible: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader 
        title="Ask for Help" 
        actions={
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <AccessibilitySettings />
              </div>
            </SheetContent>
          </Sheet>
        }
      />
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Simplified header for accessibility */}
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          What do you need help with?
        </h1>
        <p className="text-base text-muted-foreground mb-6">
          {settings.simpleMode 
            ? "Speak or type, we'll handle the rest" 
            : "Describe what you need, AI will make it clear"}
        </p>

        {/* Post limit indicator for free users */}
        {plan === "free" && !aiRewrite && !isConfirmed && !settings.simpleMode && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 mb-4 text-sm">
            <span className="text-muted-foreground">
              Posts remaining
            </span>
            <span className={`font-semibold ${postsRemaining === 0 ? "text-destructive" : "text-foreground"}`}>
              {postsRemaining}/{FREE_LIMITS.postsPerMonth}
            </span>
          </div>
        )}

        {!aiRewrite && !isConfirmed && (
          <div className="animate-fade-in space-y-6">
            {/* Voice Input - PROMINENT for elderly */}
            <div className="flex flex-col items-center py-6 bg-muted/30 rounded-2xl">
              <VoiceInput onTranscript={handleVoiceTranscript} disabled={isProcessing} />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm text-muted-foreground">
                  or type below
                </span>
              </div>
            </div>

            {/* Quick templates - hidden in simple mode */}
            {!settings.simpleMode && !input && (
              <QuickTemplates onSelect={handleTemplateSelect} />
            )}
            
            <div className="space-y-2">
              <Textarea
                placeholder="e.g., Need someone to help me carry groceries upstairs..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[140px] text-lg resize-none"
              />
              {!settings.simpleMode && (
                <p className="text-sm text-muted-foreground">
                  💡 Include what you need, when, and any details
                </p>
              )}
            </div>

            <Button
              variant="swaami"
              size="xl"
              className="w-full text-lg py-6"
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-6 h-6 animate-spin" />
                  Working on it...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  {settings.simpleMode ? "Post Request" : "Enhance & Post"}
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

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>Here's what we'll post:</span>
              </div>

              <div>
                <h3 className="font-semibold text-foreground text-xl">
                  {aiRewrite.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-base">
                  {aiRewrite.description}
                </p>
              </div>

              {!settings.simpleMode && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground">
                    ⏱ {aiRewrite.time_estimate}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                    📁 {aiRewrite.category}
                  </span>
                  <span
                    className={`text-sm px-3 py-1 rounded-full capitalize ${
                      urgencyColors[aiRewrite.urgency]
                    }`}
                  >
                    {aiRewrite.urgency === "urgent" ? "🔥" : "📌"}{" "}
                    {aiRewrite.urgency}
                  </span>
                </div>
              )}
              
              {/* Helper Preview - hidden in simple mode */}
              {!settings.simpleMode && (
                <HelperPreview category={aiRewrite.category} />
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="swaami-outline"
                size="lg"
                className="flex-1 text-lg py-6"
                onClick={handleEdit}
              >
                Change it
              </Button>
              <Button
                variant="swaami"
                size="lg"
                className="flex-1 text-lg py-6"
                onClick={handleConfirm}
              >
                <Check className="w-6 h-6" />
                Post it!
              </Button>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="animate-slide-up text-center py-16">
            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground text-2xl mb-3">Done!</h3>
            <p className="text-muted-foreground text-lg">
              Your neighbours will see this soon
            </p>
          </div>
        )}
      </main>

      <UpgradePrompt
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        trigger="post_limit"
      />
    </div>
  );
}
