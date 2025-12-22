/**
 * Anonymous Feed Preview Component
 * Shows a sample of public tasks to anonymous users to demonstrate value
 * before asking them to sign up.
 * 
 * Part of the "Hard Gate" value-before-signup strategy:
 * 1. User sees real tasks in their area (value moment)
 * 2. Clicking "Help" triggers the signup flow
 * 3. After signup, they can complete the help action
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, ChevronRight, Sparkles, Lock } from "lucide-react";

interface PreviewTask {
  id: string;
  title: string;
  category: string;
  timeEstimate: string;
  neighbourhood: string;
  urgency: "normal" | "urgent";
  ownerName: string;
  ownerTier: "tier_1" | "tier_2";
}

// Sample tasks to show anonymous users
// In production, this could fetch from a public endpoint
const SAMPLE_TASKS: PreviewTask[] = [
  {
    id: "preview-1",
    title: "Need help carrying groceries upstairs",
    category: "groceries",
    timeEstimate: "~15 mins",
    neighbourhood: "Your Neighbourhood",
    urgency: "normal",
    ownerName: "Sarah M.",
    ownerTier: "tier_2",
  },
  {
    id: "preview-2",
    title: "Can someone help set up my printer?",
    category: "tech",
    timeEstimate: "~30 mins",
    neighbourhood: "Your Neighbourhood",
    urgency: "normal",
    ownerName: "James K.",
    ownerTier: "tier_1",
  },
  {
    id: "preview-3",
    title: "Need a ride to the doctor - urgent",
    category: "transport",
    timeEstimate: "~1 hour",
    neighbourhood: "Your Neighbourhood",
    urgency: "urgent",
    ownerName: "Elena P.",
    ownerTier: "tier_2",
  },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  groceries: "🛒",
  tech: "💻",
  transport: "🚗",
  pets: "🐕",
  handyman: "🔧",
};

interface AnonymousFeedPreviewProps {
  onSignupClick: () => void;
}

export function AnonymousFeedPreview({ onSignupClick }: AnonymousFeedPreviewProps) {
  const navigate = useNavigate();
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const handleHelpClick = () => {
    // Store intent in localStorage so we can redirect after signup
    try {
      localStorage.setItem("swaami_signup_intent", JSON.stringify({
        action: "help_with_task",
        timestamp: Date.now(),
      }));
    } catch {
      // localStorage might be blocked
    }
    
    onSignupClick();
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">
            Neighbours need help right now
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/auth?mode=signup")}
        >
          See all
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {SAMPLE_TASKS.map((task) => (
          <div
            key={task.id}
            className={`
              relative bg-card border border-border rounded-xl p-4 
              transition-all duration-200
              ${hoveredTask === task.id ? "border-primary/50 shadow-md" : ""}
            `}
            onMouseEnter={() => setHoveredTask(task.id)}
            onMouseLeave={() => setHoveredTask(null)}
          >
            {/* Urgency Badge */}
            {task.urgency === "urgent" && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded-full">
                Urgent
              </span>
            )}

            <div className="flex items-start gap-3">
              {/* Category Emoji */}
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                {CATEGORY_EMOJIS[task.category] || "📋"}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3 className="font-medium text-foreground line-clamp-2 mb-1">
                  {task.title}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {task.neighbourhood}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.timeEstimate}
                  </span>
                </div>

                {/* Owner */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {task.ownerName.charAt(0)}
                  </div>
                  <span className="text-xs text-muted-foreground">{task.ownerName}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    {task.ownerTier === "tier_2" ? "Trusted" : "Verified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Help Button - triggers signup */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 group"
              onClick={handleHelpClick}
            >
              <Lock className="h-3 w-3 mr-1.5 group-hover:hidden" />
              <span className="group-hover:hidden">Sign up to help</span>
              <span className="hidden group-hover:inline">Join to help this neighbour</span>
            </Button>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-6 p-4 bg-gradient-to-br from-accent/10 to-primary/5 rounded-xl border border-accent/20">
        <div className="text-center space-y-3">
          <p className="text-sm text-foreground font-medium">
            Join thousands of neighbours helping each other
          </p>
          <Button
            variant="swaami"
            size="lg"
            className="w-full"
            onClick={() => navigate("/auth?mode=signup")}
          >
            Join Your Neighbourhood
          </Button>
          <p className="text-xs text-muted-foreground">
            Free to join · Takes 2 minutes
          </p>
        </div>
      </div>
    </div>
  );
}


