import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Check } from "lucide-react";
import swaamiLogo from "@/assets/swaami-logo.png";

export function PostScreen() {
  const [input, setInput] = useState('');
  const [aiRewrite, setAiRewrite] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate AI rewrite
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simple AI rewrite simulation
    const rewritten = formatNeed(input);
    setAiRewrite(rewritten);
    setIsProcessing(false);
  };

  const formatNeed = (text: string): string => {
    // Simple formatting logic
    const cleaned = text.trim();
    if (cleaned.length < 20) {
      return `Need help with: ${cleaned}`;
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    toast.success("Your need is now live!", {
      description: "Neighbours nearby will see your request",
    });
    
    // Reset after animation
    setTimeout(() => {
      setInput('');
      setAiRewrite(null);
      setIsConfirmed(false);
    }, 2000);
  };

  const handleEdit = () => {
    setAiRewrite(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 py-4 max-w-lg mx-auto">
          <img src={swaamiLogo} alt="Swaami" className="h-8 w-auto" />
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold text-foreground mb-1">
          Ask for help
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Describe what you need, we'll make it clear
        </p>

        {!aiRewrite && !isConfirmed && (
          <div className="animate-fade-in space-y-4">
            <Textarea
              placeholder="e.g., Need someone to help me carry groceries upstairs, can't do heavy lifting today..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[140px] text-base resize-none"
            />
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
                  Processing...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        )}

        {aiRewrite && !isConfirmed && (
          <div className="animate-slide-up space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Sparkles className="w-4 h-4" />
                <span>AI-enhanced preview</span>
              </div>
              <p className="text-foreground font-medium">{aiRewrite}</p>
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
                Confirm
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
