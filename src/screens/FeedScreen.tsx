import { useState } from "react";
import { NeedCard } from "@/components/NeedCard";
import { SAMPLE_TASKS, type Task } from "@/types/swaami";
import { toast } from "sonner";
import swaamiLogo from "@/assets/swaami-logo.png";

export function FeedScreen() {
  const [tasks] = useState<Task[]>(SAMPLE_TASKS);

  const handleHelp = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      toast.success(`You're helping with: ${task.title}`, {
        description: "We'll notify them that you're on your way!",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 py-4 max-w-lg mx-auto flex items-center justify-between">
          <img src={swaamiLogo} alt="Swaami" className="h-8 w-auto" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
            <span>500m radius</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold text-foreground mb-1">
          Nearby needs
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {tasks.length} people need help around you
        </p>

        <div className="space-y-3 stagger-children">
          {tasks.map((task) => (
            <NeedCard key={task.id} task={task} onHelp={handleHelp} />
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="font-semibold text-foreground mb-2">All caught up!</h3>
            <p className="text-muted-foreground text-sm">
              No one nearby needs help right now. Check back soon!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
